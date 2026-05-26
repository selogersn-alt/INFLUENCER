"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Link2, CheckCircle2, Users, Camera, Music, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

type PlatformKey = 'facebook' | 'instagram' | 'tiktok';

interface ConnectionState {
  facebook: { connected: boolean };
  instagram: { connected: boolean };
  tiktok: { connected: boolean };
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<ConnectionState>({
    facebook: { connected: false },
    instagram: { connected: false },
    tiktok: { connected: false },
  });
  const [loading, setLoading] = useState(true);
  const [actionPlatform, setActionPlatform] = useState<PlatformKey | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load state from backend
  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/state`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (err) {
      console.error('Failed to load connection state', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Handle redirect back from OAuth flow
  useEffect(() => {
    const connectedPlatform = searchParams.get('connected') as PlatformKey | null;
    if (connectedPlatform && connections[connectedPlatform] !== undefined) {
      setConnections(prev => ({
        ...prev,
        [connectedPlatform]: { connected: true },
      }));
      showNotification('success', `${connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1)} connected successfully!`);
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConnect = (platform: PlatformKey) => {
    // Redirect to backend OAuth entry point in same tab
    // The backend will redirect to mock or real OAuth
    window.location.href = `${API_BASE}/api/settings/connect/${platform}`;
  };

  const handleDisconnect = async (platform: PlatformKey) => {
    setActionPlatform(platform);
    try {
      const res = await fetch(`${API_BASE}/api/settings/disconnect/${platform}`, { method: 'POST' });
      if (res.ok) {
        setConnections(prev => ({ ...prev, [platform]: { connected: false } }));
        showNotification('success', `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected.`);
      } else {
        showNotification('error', 'Disconnection failed. Please try again.');
      }
    } catch {
      showNotification('error', 'Network error. Check your connection.');
    } finally {
      setActionPlatform(null);
    }
  };

  const platforms: {
    key: PlatformKey;
    label: string;
    desc: string;
    icon: React.ReactNode;
    iconBg: string;
    connectClass: string;
  }[] = [
    {
      key: 'facebook',
      label: 'Facebook Page',
      desc: 'Publish Reels · Manage specific pages · No ban risk',
      icon: <Users className="w-5 h-5 text-[#1877F2]" />,
      iconBg: 'bg-[#1877F2]/10',
      connectClass: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
    },
    {
      key: 'instagram',
      label: 'Instagram Professional',
      desc: 'Publish Reels & Stories via Graph API',
      icon: <Camera className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      connectClass: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90',
    },
    {
      key: 'tiktok',
      label: 'TikTok Account',
      desc: 'Auto-publish TikToks via Content Posting API',
      icon: <Music className="w-5 h-5 text-white" />,
      iconBg: 'bg-gray-800',
      connectClass: 'bg-gray-100 text-black hover:bg-gray-300',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all
          ${notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {notification.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {notification.msg}
        </div>
      )}

      <header>
        <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Link2 className="w-8 h-8 text-purple-400" />
          Settings & Integrations
        </h2>
        <p className="text-gray-400 mt-2">
          Connect your AI influencer's social accounts and configure API keys.
        </p>
      </header>

      {/* Social Accounts */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-100 mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Social Media Accounts
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Connections use OAuth 2.0. Tokens are stored securely in the database and never exposed.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading connection states…
          </div>
        ) : (
          <div className="space-y-4">
            {platforms.map(p => {
              const isConnected = connections[p.key]?.connected;
              const isActing = actionPlatform === p.key;

              return (
                <div
                  key={p.key}
                  className={`flex items-center justify-between p-4 bg-gray-950 rounded-xl border transition
                    ${isConnected ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-gray-800'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${p.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {p.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 flex items-center gap-2">
                        {p.label}
                        {isConnected && (
                          <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Connected
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">{p.desc}</p>
                    </div>
                  </div>

                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(p.key)}
                      disabled={isActing}
                      className="px-5 py-2 rounded-lg font-medium text-sm bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/30 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isActing && <Loader2 className="w-3 h-3 animate-spin" />}
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(p.key)}
                      disabled={isActing}
                      className={`px-6 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${p.connectClass}`}
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <span className="font-semibold">🔒 Anti-ban protection:</span> This app uses Meta's official Graph API
            with scoped page-level permissions. You will be asked to select a specific <strong>Page</strong> (not
            your personal profile) during the Facebook/Instagram authorization — this eliminates spam detection
            risks and rate-limit issues.
          </p>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-400" />
          API Keys Configuration
        </h3>

        <div className="space-y-6">
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <label className="block text-sm font-medium text-gray-300 mb-2">Google Gemini API Key (Veo Video Model)</label>
            <div className="flex gap-4">
              <input
                type="password"
                placeholder="AIzaSy..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
              />
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">Save</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Get this key from Google AI Studio. Required for Veo generation and automatic text generation.</p>
          </div>

          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
            <label className="block text-sm font-medium text-gray-300 mb-2">Kling AI / Replicate Token</label>
            <div className="flex gap-4">
              <input
                type="password"
                placeholder="r8_..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-purple-500"
              />
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition border border-gray-700">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
