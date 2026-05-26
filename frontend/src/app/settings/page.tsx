"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield, Link2, CheckCircle2, Users, Camera, Music,
  Loader2, AlertCircle, LogOut, ExternalLink
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

type PlatformKey = 'facebook' | 'instagram' | 'tiktok';

interface ConnectionState {
  facebook: { connected: boolean; pageName?: string; pageId?: string };
  instagram: { connected: boolean; username?: string; accountId?: string };
  tiktok: { connected: boolean; username?: string };
}

function AccountBadge({ platform, state }: { platform: PlatformKey; state: ConnectionState }) {
  if (platform === 'facebook' && state.facebook.connected) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs font-semibold text-emerald-400">✓ Connecté</span>
        {state.facebook.pageName && (
          <span className="text-xs text-gray-400 max-w-[160px] truncate text-right">
            📄 {state.facebook.pageName}
          </span>
        )}
        {state.facebook.pageId && (
          <span className="text-[10px] text-gray-600 font-mono">ID: {state.facebook.pageId}</span>
        )}
      </div>
    );
  }
  if (platform === 'instagram' && state.instagram.connected) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs font-semibold text-emerald-400">✓ Connecté</span>
        {state.instagram.username && (
          <span className="text-xs text-gray-400">@{state.instagram.username}</span>
        )}
      </div>
    );
  }
  if (platform === 'tiktok' && state.tiktok.connected) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs font-semibold text-emerald-400">✓ Connecté</span>
        {state.tiktok.username && (
          <span className="text-xs text-gray-400">@{state.tiktok.username}</span>
        )}
      </div>
    );
  }
  return null;
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

  useEffect(() => { fetchState(); }, []);

  useEffect(() => {
    const connectedPlatform = searchParams.get('connected') as PlatformKey | null;
    if (connectedPlatform) {
      fetchState(); // Reload to get account name from DB
      showNotification('success', `${connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1)} connecté avec succès !`);
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleConnect = (platform: PlatformKey) => {
    window.location.href = `${API_BASE}/api/settings/connect/${platform}`;
  };

  const handleDisconnect = async (platform: PlatformKey) => {
    setActionPlatform(platform);
    try {
      const res = await fetch(`${API_BASE}/api/settings/disconnect/${platform}`, { method: 'POST' });
      if (res.ok) {
        await fetchState();
        showNotification('success', `${platform.charAt(0).toUpperCase() + platform.slice(1)} déconnecté.`);
      } else {
        showNotification('error', 'Déconnexion échouée. Réessayez.');
      }
    } catch {
      showNotification('error', 'Erreur réseau.');
    } finally {
      setActionPlatform(null);
    }
  };

  const isConnected = (p: PlatformKey) => connections[p].connected;

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
      label: 'Page Facebook',
      desc: 'Publier des Reels · Permissions au niveau Page uniquement',
      icon: <Users className="w-5 h-5 text-[#1877F2]" />,
      iconBg: 'bg-[#1877F2]/10',
      connectClass: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
    },
    {
      key: 'instagram',
      label: 'Instagram Professionnel',
      desc: 'Publier des Reels & Stories via l\'API Graph',
      icon: <Camera className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      connectClass: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90',
    },
    {
      key: 'tiktok',
      label: 'Compte TikTok',
      desc: 'Publication automatique via Content Posting API',
      icon: <Music className="w-5 h-5 text-white" />,
      iconBg: 'bg-gray-800',
      connectClass: 'bg-gray-100 text-black hover:bg-gray-300',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-4 left-4 sm:left-auto sm:w-auto z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all
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
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Link2 className="w-7 h-7 text-purple-400" />
          Paramètres & Intégrations
        </h2>
        <p className="text-gray-500 mt-1.5 text-sm">
          Connectez les comptes sociaux de votre influenceuse IA et configurez les clés API.
        </p>
      </header>

      {/* Social Accounts */}
      <div className="rounded-2xl p-5 sm:p-8" style={{ background: 'rgba(17,17,27,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-bold text-gray-100">Comptes sur les réseaux sociaux</h3>
        </div>
        <p className="text-xs text-gray-600 mb-6 ml-7">
          OAuth 2.0 · Permissions au niveau Page · Tokens stockés en base de données chiffrée
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-3 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement des connexions…
          </div>
        ) : (
          <div className="space-y-3">
            {platforms.map(p => {
              const connected = isConnected(p.key);
              const isActing = actionPlatform === p.key;

              return (
                <div
                  key={p.key}
                  className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200
                    ${connected
                      ? 'bg-emerald-950/10 border-emerald-500/20'
                      : 'border-white/5 hover:border-white/10'}`}
                  style={{ background: connected ? undefined : 'rgba(0,0,0,0.2)' }}
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${p.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {p.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-gray-200 flex items-center gap-2 flex-wrap">
                        {p.label}
                        {connected && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-semibold">
                            ACTIF
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{p.desc}</p>
                    </div>
                  </div>

                  {/* Right: account badge + action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {connected && <AccountBadge platform={p.key} state={connections} />}

                    {connected ? (
                      <button
                        onClick={() => handleDisconnect(p.key)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 transition disabled:opacity-40"
                      >
                        {isActing
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <LogOut className="w-3 h-3" />}
                        <span className="hidden sm:inline">Déconnecter</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(p.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${p.connectClass} shadow-lg`}
                        style={{ boxShadow: 'none' }}
                      >
                        Connecter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Anti-ban banner */}
        <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <span className="font-semibold">🔒 Protection anti-bannissement :</span>{' '}
            Cette application utilise l&apos;API Graph officielle de Meta avec des permissions au niveau <strong>Page</strong> (jamais votre profil personnel). Vous devrez identifier exactement sur quelle page les contenus seront publiés lors de la connexion — cela élimine les risques de détection de spam.
          </p>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-2xl p-5 sm:p-8" style={{ background: 'rgba(17,17,27,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-bold text-gray-100">Configuration des Clés API</h3>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-[10px]">G</span>
              Google Gemini API Key <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full bg-emerald-500/10">Configurée ✓</span>
            </label>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="AIzaSy… (déjà configurée sur le serveur)"
                className="input-field text-sm"
              />
              <button className="btn-primary text-sm px-4 py-2 whitespace-nowrap">Mettre à jour</button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Utilisée pour Imagen 3 (génération d&apos;images) et la génération de texte automatique.</p>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label className="block text-sm font-medium text-gray-300 mb-2">Replicate Token (Vidéos Kling / Luma)</label>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="r8_…"
                className="input-field text-sm"
              />
              <button className="btn-secondary text-sm px-4 py-2">Sauvegarder</button>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label className="block text-sm font-medium text-gray-300 mb-1">Clés OAuth Facebook / Instagram</label>
            <p className="text-xs text-gray-600 mb-3">Pour activer le vrai flux OAuth Meta au lieu du sandbox, ajoutez ces variables sur le serveur.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="password" placeholder="FACEBOOK_CLIENT_ID" className="input-field text-sm font-mono" />
              <input type="password" placeholder="FACEBOOK_CLIENT_SECRET" className="input-field text-sm font-mono" />
            </div>
            <div className="flex justify-end mt-3">
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" /> Créer une app Meta Developers
              </a>
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
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement…
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
