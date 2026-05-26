import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

const DEFAULT_USER_ID = 'demo-user-id';

type Platform = 'facebook' | 'instagram' | 'tiktok';

// --- Helper: Get platform display info ---
const platformInfo: Record<Platform, { name: string; color: string; scope: string }> = {
  facebook: { name: 'Facebook', color: '#1877F2', scope: 'pages_manage_posts,pages_read_engagement' },
  instagram: { name: 'Instagram', color: '#E1306C', scope: 'instagram_basic,instagram_content_publish' },
  tiktok: { name: 'TikTok', color: '#010101', scope: 'video.upload,user.info.basic' },
};

// --- GET /api/settings/state ---
// Returns the current social connection state for the default user
router.get('/state', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      facebook: { connected: user.facebookConnected },
      instagram: { connected: user.instagramConnected },
      tiktok: { connected: user.tiktokConnected },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/settings/connect/:platform ---
// Redirects to real OAuth or to the sandbox mock screen
router.get('/connect/:platform', (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  if (!platformInfo[platform]) return res.status(400).json({ error: 'Unknown platform' });

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];
  const baseUrl = process.env.BASE_URL || 'https://influenceur.digitalh.net';

  if (clientId && clientSecret) {
    // --- Real OAuth Flow ---
    if (platform === 'facebook' || platform === 'instagram') {
      const redirectUri = `${baseUrl}/api/settings/callback/${platform}`;
      const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${platformInfo[platform].scope}&response_type=code`;
      return res.redirect(oauthUrl);
    }
    if (platform === 'tiktok') {
      const redirectUri = `${baseUrl}/api/settings/callback/tiktok`;
      const oauthUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${platformInfo[platform].scope}&response_type=code`;
      return res.redirect(oauthUrl);
    }
  }

  // --- Sandbox/Mock Flow ---
  res.redirect(`/api/settings/oauth-mock/${platform}`);
});

// --- GET /api/settings/oauth-mock/:platform ---
// Serves a beautiful consent screen for testing
router.get('/oauth-mock/:platform', (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  const info = platformInfo[platform];
  if (!info) return res.status(400).send('Unknown platform');

  const permissionsMap: Record<Platform, string[]> = {
    facebook: ['Publish content on your page', 'Read engagement metrics', 'Access page list'],
    instagram: ['Publish Reels & Stories', 'Read media insights', 'Access profile information'],
    tiktok: ['Upload & publish videos', 'Read profile info', 'Access analytics data'],
  };
  const permissions = permissionsMap[platform];

  const iconMap: Record<Platform, string> = {
    facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${info.color}"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${info.color}"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34v-6.9a8.21 8.21 0 004.79 1.53V6.5a4.85 4.85 0 01-1.02-.19z"/></svg>`,
  };

  const bgColor = platform === 'tiktok' ? '#010101' : platform === 'instagram' ? '#833ab4' : '#1877F2';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${info.name} Authorization</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0f;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111118;
      border: 1px solid #222;
      border-radius: 24px;
      padding: 48px 40px;
      width: 100%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 25px 80px rgba(0,0,0,0.6);
    }
    .platform-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: ${bgColor}22;
      border: 2px solid ${bgColor}55;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .sandbox-badge {
      display: inline-block;
      background: #f59e0b22;
      border: 1px solid #f59e0b44;
      color: #f59e0b;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    h1 { color: #f8f8ff; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
    .app-info {
      background: #0d0d15;
      border: 1px solid #1e1e2e;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 28px;
      text-align: left;
    }
    .app-info .app-name { font-weight: 600; color: #d0d0e0; font-size: 15px; }
    .app-info .app-desc { font-size: 12px; color: #555; margin-top: 2px; }
    .permissions { text-align: left; margin-bottom: 32px; }
    .permissions h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin-bottom: 12px; }
    .permission-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #1a1a25;
      color: #aaa;
      font-size: 13px;
    }
    .permission-item:last-child { border-bottom: none; }
    .check-icon { color: ${bgColor}; flex-shrink: 0; }
    .btn-authorize {
      width: 100%;
      padding: 14px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      background: ${bgColor};
      color: white;
      transition: opacity 0.2s, transform 0.1s;
      margin-bottom: 12px;
    }
    .btn-authorize:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-authorize:active { transform: translateY(0); }
    .btn-cancel {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid #2a2a35;
      background: transparent;
      color: #666;
      transition: background 0.2s;
    }
    .btn-cancel:hover { background: #1a1a25; color: #999; }
    .footer-note { color: #333; font-size: 11px; margin-top: 24px; }
    .spinner { display: none; }
    .btn-authorize.loading .spinner { display: inline-block; }
    .btn-authorize.loading .btn-text { display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="sandbox-badge">🧪 SANDBOX MODE</div>
    <div class="platform-icon">${iconMap[platform]}</div>
    <h1>${info.name} Authorization</h1>
    <p class="subtitle">AI Studio wants to publish on your behalf</p>

    <div class="app-info">
      <div class="app-name">🤖 AI Influencer Studio</div>
      <div class="app-desc">influenceur.digitalh.net · Automated content publishing</div>
    </div>

    <div class="permissions">
      <h3>Permissions requested</h3>
      ${permissions.map(p => `
      <div class="permission-item">
        <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${p}
      </div>`).join('')}
    </div>

    <button class="btn-authorize" id="authorize-btn" onclick="authorize()">
      <span class="btn-text">Authorize AI Studio</span>
      <span class="spinner spin">⟳</span>
    </button>
    <button class="btn-cancel" onclick="window.close()">Cancel</button>
    <p class="footer-note">This is a sandbox simulation. No real credentials are transmitted.</p>
  </div>
  <script>
    function authorize() {
      document.getElementById('authorize-btn').classList.add('loading');
      // Redirect to the mock callback which will save state to DB
      window.location.href = '/api/settings/callback/${platform}?code=mock_sandbox_code_${platform}';
    }
  </script>
</body>
</html>`;

  res.send(html);
});

// --- GET /api/settings/callback/:platform ---
// Handles the OAuth callback (real or mock), saves token to DB, redirects to frontend
router.get('/callback/:platform', async (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  const { code } = req.query;

  if (!code) return res.status(400).send('Missing authorization code');

  try {
    // In a real flow we would exchange `code` for an access token here.
    // For sandbox, we use a placeholder token.
    const isMock = String(code).startsWith('mock_sandbox_code_');
    const token = isMock ? `sandbox_token_${platform}_${Date.now()}` : String(code);

    const updateData: Record<string, boolean | string> = {
      [`${platform}Connected`]: true,
      [`${platform}Token`]: token,
    };

    await prisma.user.update({
      where: { id: DEFAULT_USER_ID },
      data: updateData,
    });

    // Redirect back to the frontend settings page
    const frontendUrl = process.env.FRONTEND_URL || 'https://influenceur.digitalh.net';
    res.redirect(`${frontendUrl}/settings?connected=${platform}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// --- POST /api/settings/disconnect/:platform ---
// Revokes connection and removes token from DB
router.post('/disconnect/:platform', async (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  if (!platformInfo[platform]) return res.status(400).json({ error: 'Unknown platform' });

  try {
    const updateData: Record<string, boolean | null> = {
      [`${platform}Connected`]: false,
      [`${platform}Token`]: null,
    };

    await prisma.user.update({
      where: { id: DEFAULT_USER_ID },
      data: updateData,
    });

    res.json({ success: true, platform, connected: false });
  } catch (err) {
    console.error('Disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
