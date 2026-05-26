import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

const DEFAULT_USER_ID = 'demo-user-id';

type Platform = 'facebook' | 'instagram' | 'tiktok';

const platformInfo: Record<Platform, { name: string; color: string; scope: string }> = {
  facebook: { name: 'Facebook', color: '#1877F2', scope: 'pages_manage_posts,pages_read_engagement,pages_show_list' },
  instagram: { name: 'Instagram', color: '#E1306C', scope: 'instagram_basic,instagram_content_publish,pages_show_list' },
  tiktok: { name: 'TikTok', color: '#010101', scope: 'video.upload,user.info.basic' },
};

// --- GET /api/settings/state ---
router.get('/state', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      facebook: {
        connected: user.facebookConnected,
        pageName: user.facebookPageName,
        pageId: user.facebookPageId,
      },
      instagram: {
        connected: user.instagramConnected,
        username: user.instagramUsername,
        accountId: user.instagramAccountId,
      },
      tiktok: {
        connected: user.tiktokConnected,
        username: user.tiktokUsername,
      },
      credentials: {
        geminiApiKeyConfigured: !!user.geminiApiKey,
        replicateTokenConfigured: !!user.replicateToken,
        facebookClientIdConfigured: !!user.facebookClientId,
        facebookClientSecretConfigured: !!user.facebookClientSecret,
        tiktokClientIdConfigured: !!user.tiktokClientId,
        tiktokClientSecretConfigured: !!user.tiktokClientSecret,
        
        geminiApiKey: user.geminiApiKey ? `••••••••${user.geminiApiKey.slice(-4)}` : '',
        replicateToken: user.replicateToken ? `••••••••${user.replicateToken.slice(-4)}` : '',
        facebookClientId: user.facebookClientId ? `••••••••${user.facebookClientId.slice(-4)}` : '',
        facebookClientSecret: user.facebookClientSecret ? '••••••••' : '',
        tiktokClientId: user.tiktokClientId ? `••••••••${user.tiktokClientId.slice(-4)}` : '',
        tiktokClientSecret: user.tiktokClientSecret ? '••••••••' : '',
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/settings/credentials ---
router.post('/credentials', async (req: Request, res: Response) => {
  const {
    geminiApiKey,
    replicateToken,
    facebookClientId,
    facebookClientSecret,
    tiktokClientId,
    tiktokClientSecret
  } = req.body;

  try {
    const updateData: Record<string, string | null> = {};
    if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey || null;
    if (replicateToken !== undefined) updateData.replicateToken = replicateToken || null;
    if (facebookClientId !== undefined) updateData.facebookClientId = facebookClientId || null;
    if (facebookClientSecret !== undefined) updateData.facebookClientSecret = facebookClientSecret || null;
    if (tiktokClientId !== undefined) updateData.tiktokClientId = tiktokClientId || null;
    if (tiktokClientSecret !== undefined) updateData.tiktokClientSecret = tiktokClientSecret || null;

    await prisma.user.update({
      where: { id: DEFAULT_USER_ID },
      data: updateData,
    });

    res.json({ success: true, message: 'Identifiants mis à jour avec succès.' });
  } catch (err) {
    console.error('Credentials update error:', err);
    res.status(500).json({ error: 'Impossible de sauvegarder les identifiants.' });
  }
});

// --- GET /api/settings/connect/:platform ---
router.get('/connect/:platform', async (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  if (!platformInfo[platform]) return res.status(400).json({ error: 'Unknown platform' });

  try {
    const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
    
    // Read Client ID and Secret from DB or .env
    const clientId = (platform === 'facebook' || platform === 'instagram')
      ? (user?.facebookClientId || process.env.FACEBOOK_CLIENT_ID)
      : (user?.tiktokClientId || process.env.TIKTOK_CLIENT_ID);
      
    const clientSecret = (platform === 'facebook' || platform === 'instagram')
      ? (user?.facebookClientSecret || process.env.FACEBOOK_CLIENT_SECRET)
      : (user?.tiktokClientSecret || process.env.TIKTOK_CLIENT_SECRET);
      
    const baseUrl = process.env.BASE_URL || 'https://influenceur.digitalh.net';

    if (clientId && clientSecret) {
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

    // No real keys → Sandbox mock with account form
    res.redirect(`/api/settings/oauth-mock/${platform}`);
  } catch (err) {
    console.error('Connect route error:', err);
    res.status(500).send('Internal server error');
  }
});

// --- GET /api/settings/oauth-mock/:platform ---
// Full consent page WITH account identity form
router.get('/oauth-mock/:platform', (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  const info = platformInfo[platform];
  if (!info) return res.status(400).send('Unknown platform');

  const bgColor = platform === 'tiktok' ? '#010101' : platform === 'instagram' ? '#833ab4' : '#1877F2';

  const iconMap: Record<Platform, string> = {
    facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${info.color}"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${info.color}"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34v-6.9a8.21 8.21 0 004.79 1.53V6.5a4.85 4.85 0 01-1.02-.19z"/></svg>`,
  };

  // Platform-specific form fields
  const formFields: Record<Platform, string> = {
    facebook: `
      <div class="field-group">
        <label>Nom de votre Page Facebook</label>
        <input type="text" id="fb-page-name" name="pageName" placeholder="Ex: Ma Marque Officielle" required />
        <span class="hint">Le nom exact tel qu'affiché sur votre page</span>
      </div>
      <div class="field-group">
        <label>ID de la Page <span class="optional">(optionnel mais recommandé)</span></label>
        <input type="text" id="fb-page-id" name="pageId" placeholder="Ex: 123456789012345" />
        <span class="hint">Trouvez l'ID sur facebook.com/pages/about → Transparence de la page</span>
      </div>`,
    instagram: `
      <div class="field-group">
        <label>Nom d'utilisateur Instagram</label>
        <div class="input-prefix-wrap">
          <span class="prefix">@</span>
          <input type="text" id="ig-username" name="username" placeholder="mon_compte_pro" required />
        </div>
        <span class="hint">Doit être un compte Professionnel ou Créateur lié à une Page Facebook</span>
      </div>`,
    tiktok: `
      <div class="field-group">
        <label>Nom d'utilisateur TikTok</label>
        <div class="input-prefix-wrap">
          <span class="prefix">@</span>
          <input type="text" id="tt-username" name="username" placeholder="mon_compte_tiktok" required />
        </div>
        <span class="hint">Le compte sur lequel les vidéos seront publiées</span>
      </div>`,
  };

  const permissionsMap: Record<Platform, string[]> = {
    facebook: ['Publier sur votre Page (pas votre profil)', 'Voir les statistiques de la page', 'Accéder à la liste de vos pages'],
    instagram: ['Publier des Reels & Stories', 'Lire les insights du compte', 'Accéder aux infos du profil pro'],
    tiktok: ['Uploader et publier des vidéos', 'Lire les infos du profil', 'Accéder aux données analytiques'],
  };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Connexion ${info.name}</title>
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
      border: 1px solid #1e1e2e;
      border-radius: 24px;
      padding: 40px 36px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.7);
    }
    .platform-icon {
      width: 60px; height: 60px;
      border-radius: 16px;
      background: ${bgColor}22;
      border: 1px solid ${bgColor}44;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .sandbox-badge {
      display: inline-block;
      background: #f59e0b22;
      border: 1px solid #f59e0b44;
      color: #f59e0b;
      font-size: 11px; font-weight: 600;
      padding: 3px 10px; border-radius: 20px;
      letter-spacing: 0.05em; margin-bottom: 14px;
    }
    h1 { color: #f8f8ff; font-size: 20px; font-weight: 700; margin-bottom: 4px; text-align:center; }
    .subtitle { color: #555; font-size: 13px; margin-bottom: 28px; text-align:center; }

    /* Account form section */
    .section-label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
      color: #444; font-weight: 600; margin-bottom: 12px;
    }
    .account-form {
      background: #0d0d18;
      border: 1px solid ${bgColor}33;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .account-form-title {
      font-size: 13px; font-weight: 600; color: #d0d0e0;
      margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .account-form-title .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: ${bgColor};
    }
    .field-group { margin-bottom: 14px; }
    .field-group:last-child { margin-bottom: 0; }
    .field-group label {
      display: block; font-size: 12px; font-weight: 500;
      color: #999; margin-bottom: 6px;
    }
    .field-group input {
      width: 100%; background: #060608;
      border: 1px solid #2a2a3a;
      border-radius: 10px; padding: 10px 14px;
      font-size: 13px; color: #e0e0f0;
      font-family: 'Inter', sans-serif;
      outline: none; transition: border-color 0.2s;
    }
    .field-group input:focus { border-color: ${bgColor}88; }
    .field-group input::placeholder { color: #333; }
    .hint { font-size: 11px; color: #333; margin-top: 5px; display: block; line-height: 1.4; }
    .optional { color: #333; font-weight: 400; }
    .input-prefix-wrap { position: relative; }
    .input-prefix-wrap .prefix {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #555; font-size: 13px; font-weight: 600;
    }
    .input-prefix-wrap input { padding-left: 26px; }

    /* Permissions */
    .permissions { margin-bottom: 24px; }
    .perm-item {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 0;
      border-bottom: 1px solid #12121c;
      color: #666; font-size: 12px;
    }
    .perm-item:last-child { border-bottom: none; }
    .check { color: ${bgColor}; flex-shrink: 0; }

    /* Buttons */
    .btn-authorize {
      width: 100%; padding: 14px;
      border-radius: 12px; font-size: 14px; font-weight: 600;
      cursor: pointer; border: none;
      background: ${bgColor}; color: white;
      transition: opacity 0.2s, transform 0.1s;
      margin-bottom: 10px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-authorize:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-authorize:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-cancel {
      width: 100%; padding: 11px;
      border-radius: 12px; font-size: 13px; font-weight: 500;
      cursor: pointer; border: 1px solid #1e1e2e;
      background: transparent; color: #444;
      transition: background 0.2s;
    }
    .btn-cancel:hover { background: #1a1a25; color: #777; }
    .footer-note { color: #252530; font-size: 10px; margin-top: 20px; text-align: center; line-height: 1.5; }
    .error-msg { display: none; color: #f87171; font-size: 12px; margin-top: 8px; }
    .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align:center">
      <div class="sandbox-badge">🧪 MODE SANDBOX — Simulation</div>
      <div class="platform-icon">${iconMap[platform]}</div>
      <h1>Connexion ${info.name}</h1>
      <p class="subtitle">Indiquez le compte sur lequel AI Studio publiera</p>
    </div>

    <div class="account-form">
      <div class="account-form-title">
        <div class="dot"></div>
        Identifiez votre compte ${info.name}
      </div>
      ${formFields[platform]}
    </div>

    <p class="section-label">Permissions accordées</p>
    <div class="permissions">
      ${permissionsMap[platform].map(p => `
      <div class="perm-item">
        <svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${p}
      </div>`).join('')}
    </div>

    <div id="error-msg" class="error-msg">⚠ Veuillez remplir les champs obligatoires.</div>

    <button class="btn-authorize" id="authorize-btn" onclick="authorize()">
      <span id="btn-label">Autoriser AI Studio à publier</span>
    </button>
    <button class="btn-cancel" onclick="history.back()">Annuler</button>

    <p class="footer-note">
      Sandbox : aucun accès réel n'est établi. Pour une connexion réelle, configurez<br/>
      <strong>${platform.toUpperCase()}_CLIENT_ID</strong> et <strong>${platform.toUpperCase()}_CLIENT_SECRET</strong> dans le fichier .env du serveur.
    </p>
  </div>

  <script>
    function getFormData() {
      const data = {};
      ${platform === 'facebook' ? `
      data.pageName = document.getElementById('fb-page-name').value.trim();
      data.pageId   = document.getElementById('fb-page-id').value.trim();
      ` : platform === 'instagram' ? `
      data.username = document.getElementById('ig-username').value.trim();
      ` : `
      data.username = document.getElementById('tt-username').value.trim();
      `}
      return data;
    }

    function validate(data) {
      ${platform === 'facebook' ? `return !!data.pageName;` : `return !!data.username;`}
    }

    function authorize() {
      const data = getFormData();
      if (!validate(data)) {
        document.getElementById('error-msg').style.display = 'block';
        return;
      }
      document.getElementById('error-msg').style.display = 'none';
      const btn = document.getElementById('authorize-btn');
      btn.disabled = true;
      document.getElementById('btn-label').innerHTML = '<span class="spinner"></span> Connexion en cours…';

      const params = new URLSearchParams(data);
      params.append('code', 'mock_sandbox_code_${platform}');
      window.location.href = '/api/settings/callback/${platform}?' + params.toString();
    }
  </script>
</body>
</html>`;

  res.send(html);
});

// --- GET /api/settings/callback/:platform ---
router.get('/callback/:platform', async (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  const { code, pageName, pageId, username } = req.query as Record<string, string>;

  if (!code) return res.status(400).send('Missing authorization code');

  try {
    const isMock = code.startsWith('mock_sandbox_code_');
    const token = isMock ? `sandbox_token_${platform}_${Date.now()}` : code;

    // Build the update object with identity info
    const updateData: Record<string, boolean | string | null> = {
      [`${platform}Connected`]: true,
      [`${platform}Token`]: token,
    };

    if (platform === 'facebook') {
      if (pageName) updateData.facebookPageName = pageName;
      if (pageId) updateData.facebookPageId = pageId;
    } else if (platform === 'instagram') {
      if (username) updateData.instagramUsername = username;
    } else if (platform === 'tiktok') {
      if (username) updateData.tiktokUsername = username;
    }

    await prisma.user.update({
      where: { id: DEFAULT_USER_ID },
      data: updateData,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://influenceur.digitalh.net';
    res.redirect(`${frontendUrl}/settings?connected=${platform}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// --- POST /api/settings/disconnect/:platform ---
router.post('/disconnect/:platform', async (req: Request, res: Response) => {
  const platform = req.params.platform as Platform;
  if (!platformInfo[platform]) return res.status(400).json({ error: 'Unknown platform' });

  try {
    const updateData: Record<string, boolean | null> = {
      [`${platform}Connected`]: false,
      [`${platform}Token`]: null,
    };

    // Also clear identity fields
    if (platform === 'facebook') {
      updateData.facebookPageName = null;
      updateData.facebookPageId = null;
    } else if (platform === 'instagram') {
      updateData.instagramUsername = null;
      updateData.instagramAccountId = null;
    } else if (platform === 'tiktok') {
      updateData.tiktokUsername = null;
    }

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
