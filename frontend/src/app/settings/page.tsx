"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield, Link2, CheckCircle2, Users, Camera, Music,
  Loader2, AlertCircle, LogOut, ExternalLink, X,
  ChevronRight, Info, ArrowRight, Check
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
type PlatformKey = 'facebook' | 'instagram' | 'tiktok';

interface ConnectionState {
  facebook: { connected: boolean; pageName?: string; pageId?: string };
  instagram: { connected: boolean; username?: string; accountId?: string };
  tiktok: { connected: boolean; username?: string };
}

// ─── Guide content per platform ───────────────────────────────────────────────
const platformGuides: Record<PlatformKey, {
  color: string;
  bg: string;
  title: string;
  accountType: string;
  steps: { icon: string; title: string; desc: string }[];
  warning?: string;
  helpUrl: string;
  helpLabel: string;
}> = {
  facebook: {
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.08)',
    title: 'Connecter une Page Facebook',
    accountType: 'Page Facebook (pas votre profil personnel)',
    steps: [
      {
        icon: '1',
        title: 'Assurez-vous d\'avoir une Page Facebook',
        desc: 'Allez sur facebook.com → Menu → Pages. Si vous n\'en avez pas, créez-en une (professionnelle ou créateur de contenu).',
      },
      {
        icon: '2',
        title: 'Trouvez l\'ID de votre page (optionnel)',
        desc: 'Sur votre page → Paramètres → Transparence de la page → ID de la page. Ex: 123456789012345',
      },
      {
        icon: '3',
        title: 'Cliquez "Autoriser" et renseignez le nom',
        desc: 'Sur la page suivante, entrez le nom exact de votre Page Facebook. AI Studio publiera uniquement sur cette page.',
      },
    ],
    warning: 'En mode Sandbox, aucune connexion réelle n\'est établie. Pour une vraie connexion Meta, configurez FACEBOOK_CLIENT_ID et FACEBOOK_CLIENT_SECRET dans le .env du serveur.',
    helpUrl: 'https://www.facebook.com/pages/',
    helpLabel: 'Voir mes pages Facebook',
  },
  instagram: {
    color: '#E1306C',
    bg: 'rgba(225,48,108,0.08)',
    title: 'Connecter Instagram Professionnel',
    accountType: 'Compte Professionnel ou Créateur Instagram',
    steps: [
      {
        icon: '1',
        title: 'Passez en compte Professionnel',
        desc: 'Paramètres Instagram → Type de compte → Passer en compte professionnel. Choisissez "Créateur" ou "Entreprise".',
      },
      {
        icon: '2',
        title: 'Liez à une Page Facebook',
        desc: 'Paramètres Instagram → Compte → Page Facebook liée. C\'est obligatoire pour l\'API de publication.',
      },
      {
        icon: '3',
        title: 'Entrez votre @username',
        desc: 'Sur la page suivante, entrez votre @username Instagram (sans le @). Ex: mon_compte_influenceur',
      },
    ],
    warning: 'Instagram impose un compte Professionnel lié à une Page Facebook pour l\'API de publication. Un compte personnel ne peut pas être connecté.',
    helpUrl: 'https://help.instagram.com/502981923235522',
    helpLabel: 'Comment passer en compte Pro',
  },
  tiktok: {
    color: '#000000',
    bg: 'rgba(255,255,255,0.04)',
    title: 'Connecter un compte TikTok',
    accountType: 'Compte TikTok Creator/Business',
    steps: [
      {
        icon: '1',
        title: 'Ouvrez l\'application TikTok',
        desc: 'Assurez-vous d\'être connecté au compte sur lequel vous souhaitez publier automatiquement.',
      },
      {
        icon: '2',
        title: 'Activez le compte Creator/Business',
        desc: 'Paramètres → Gérer le compte → Passer en compte Creator ou Business pour accéder à l\'API de publication.',
      },
      {
        icon: '3',
        title: 'Entrez votre @username TikTok',
        desc: 'Sur la page suivante, entrez votre @username TikTok. AI Studio publiera les vidéos générées sur ce compte.',
      },
    ],
    warning: 'TikTok exige une validation de l\'API Content Posting pour la publication automatique. En mode Sandbox, les publications sont simulées.',
    helpUrl: 'https://www.tiktok.com/creators/creator-portal/',
    helpLabel: 'TikTok Creator Portal',
  },
};

// ─── Connection Guide Modal ────────────────────────────────────────────────────
function ConnectModal({
  platform,
  onClose,
  onProceed,
}: {
  platform: PlatformKey;
  onClose: () => void;
  onProceed: () => void;
}) {
  const guide = platformGuides[platform];
  const [step, setStep] = useState(0); // 0 = guide, 1 = ready

  const platformIcons: Record<PlatformKey, React.ReactNode> = {
    facebook: <Users className="w-6 h-6" style={{ color: guide.color }} />,
    instagram: <Camera className="w-6 h-6 text-white" />,
    tiktok: <Music className="w-6 h-6 text-white" />,
  };
  const iconBg: Record<PlatformKey, string> = {
    facebook: 'bg-[#1877F2]/10',
    instagram: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    tiktok: 'bg-gray-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full sm:max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[platform]}`}>
              {platformIcons[platform]}
            </div>
            <div>
              <h3 className="font-bold text-gray-100 text-base">{guide.title}</h3>
              <p className="text-xs text-gray-500">{guide.accountType}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 text-gray-500 hover:text-gray-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-400 leading-relaxed">
            Suivez ces étapes avant de cliquer sur <strong className="text-gray-200">"Continuer vers l'authentification"</strong> :
          </p>

          {/* Steps */}
          <div className="space-y-3">
            {guide.steps.map((s, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: guide.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200 mb-1">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Warning */}
          {guide.warning && (
            <div className="flex gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80 leading-relaxed">{guide.warning}</p>
            </div>
          )}

          {/* Help link */}
          <a href={guide.helpUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium transition w-fit"
            style={{ color: guide.color }}>
            <ExternalLink className="w-3 h-3" />
            {guide.helpLabel}
          </a>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 flex gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose}
            className="flex-1 btn-secondary py-3">
            Annuler
          </button>
          <button onClick={onProceed}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: guide.color }}>
            Continuer vers l&apos;authentification
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Badge ─────────────────────────────────────────────────────────────
function AccountBadge({ platform, state }: { platform: PlatformKey; state: ConnectionState }) {
  if (platform === 'facebook' && state.facebook.connected) {
    return (
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Connecté</span>
        </div>
        {state.facebook.pageName && (
          <span className="text-xs text-gray-400 block mt-0.5">📄 {state.facebook.pageName}</span>
        )}
        {state.facebook.pageId && (
          <span className="text-[10px] text-gray-600 font-mono block">ID: {state.facebook.pageId}</span>
        )}
      </div>
    );
  }
  if (platform === 'instagram' && state.instagram.connected) {
    return (
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Connecté</span>
        </div>
        {state.instagram.username && (
          <span className="text-xs text-gray-400 block mt-0.5">@{state.instagram.username}</span>
        )}
      </div>
    );
  }
  if (platform === 'tiktok' && state.tiktok.connected) {
    return (
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Connecté</span>
        </div>
        {state.tiktok.username && (
          <span className="text-xs text-gray-400 block mt-0.5">@{state.tiktok.username}</span>
        )}
      </div>
    );
  }
  return null;
}

// ─── Main Settings Content ─────────────────────────────────────────────────────
function SettingsContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<any>({
    facebook: { connected: false },
    instagram: { connected: false },
    tiktok: { connected: false },
  });
  const [loading, setLoading] = useState(true);
  const [actionPlatform, setActionPlatform] = useState<PlatformKey | null>(null);
  const [guideModal, setGuideModal] = useState<PlatformKey | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // States for API & OAuth credentials
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [replicateToken, setReplicateToken] = useState('');
  const [facebookClientId, setFacebookClientId] = useState('');
  const [facebookClientSecret, setFacebookClientSecret] = useState('');
  const [tiktokClientId, setTiktokClientId] = useState('');
  const [tiktokClientSecret, setTiktokClientSecret] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/state`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
        if (data.credentials) {
          setGeminiApiKey(data.credentials.geminiApiKey || '');
          setReplicateToken(data.credentials.replicateToken || '');
          setFacebookClientId(data.credentials.facebookClientId || '');
          setFacebookClientSecret(data.credentials.facebookClientSecret || '');
          setTiktokClientId(data.credentials.tiktokClientId || '');
          setTiktokClientSecret(data.credentials.tiktokClientSecret || '');
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchState(); }, []);

  useEffect(() => {
    const p = searchParams.get('connected') as PlatformKey | null;
    if (p) {
      fetchState();
      showNotification('success', `${p.charAt(0).toUpperCase() + p.slice(1)} connecté avec succès ! ✓`);
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleConnectProceed = (platform: PlatformKey) => {
    setGuideModal(null);
    window.location.href = `${API_BASE}/api/settings/connect/${platform}`;
  };

  const handleDisconnect = async (platform: PlatformKey) => {
    setActionPlatform(platform);
    try {
      const res = await fetch(`${API_BASE}/api/settings/disconnect/${platform}`, { method: 'POST' });
      if (res.ok) { await fetchState(); showNotification('success', `${platform} déconnecté.`); }
      else showNotification('error', 'Déconnexion échouée.');
    } catch { showNotification('error', 'Erreur réseau.'); }
    finally { setActionPlatform(null); }
  };  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCreds(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiApiKey.startsWith('••••••••') ? undefined : geminiApiKey,
          replicateToken: replicateToken.startsWith('••••••••') ? undefined : replicateToken,
          facebookClientId: facebookClientId.startsWith('••••••••') ? undefined : facebookClientId,
          facebookClientSecret: facebookClientSecret === '••••••••' ? undefined : facebookClientSecret,
          tiktokClientId: tiktokClientId.startsWith('••••••••') ? undefined : tiktokClientId,
          tiktokClientSecret: tiktokClientSecret === '••••••••' ? undefined : tiktokClientSecret,
        })
      });
      if (res.ok) {
        showNotification('success', 'Identifiants et clés API enregistrés avec succès ! ✓');
        await fetchState();
      } else {
        showNotification('error', 'Erreur lors de l\'enregistrement des identifiants.');
      }
    } catch {
      showNotification('error', 'Erreur réseau.');
    } finally {
      setIsSavingCreds(false);
    }
  };

  const platforms: {
    key: PlatformKey;
    label: string;
    desc: string;
    icon: React.ReactNode;
    iconBg: string;
    color: string;
  }[] = [
    {
      key: 'facebook',
      label: 'Page Facebook',
      desc: 'Reels & Publications · Permissions Page uniquement',
      icon: <Users className="w-5 h-5 text-[#1877F2]" />,
      iconBg: 'bg-[#1877F2]/10',
      color: '#1877F2',
    },
    {
      key: 'instagram',
      label: 'Instagram Professionnel',
      desc: 'Reels & Stories · Compte Pro/Créateur requis',
      icon: <Camera className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      color: '#E1306C',
    },
    {
      key: 'tiktok',
      label: 'Compte TikTok',
      desc: 'Publication automatique · Content Posting API',
      icon: <Music className="w-5 h-5 text-white" />,
      iconBg: 'bg-gray-800',
      color: '#555',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      {/* Guide Modal */}
      {guideModal && (
        <ConnectModal
          platform={guideModal}
          onClose={() => setGuideModal(null)}
          onProceed={() => handleConnectProceed(guideModal)}
        />
      )}

      {/* Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto sm:min-w-80 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
          ${notification.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/90 border-red-500/30 text-red-300'}`}
          style={{ backdropFilter: 'blur(20px)' }}>
          {notification.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {notification.msg}
        </div>
      )}

      {/* Page header */}
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Link2 className="w-7 h-7 text-purple-400" />
          Paramètres & Intégrations
        </h2>
        <p className="text-gray-500 mt-1.5 text-sm">
          Connectez les comptes sociaux de votre influenceuse IA et gérez les clés API.
        </p>
      </header>

      {/* ── Social Accounts ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Section header */}
        <div className="px-5 sm:px-7 py-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="font-bold text-gray-100">Comptes Réseaux Sociaux</h3>
          </div>
          <p className="text-xs text-gray-600 ml-6">
            Cliquez sur <strong className="text-gray-500">Connecter</strong> — un guide vous expliquera exactement quoi faire.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 gap-3 text-gray-600 text-sm"
            style={{ background: 'rgba(14,14,26,0.95)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement des connexions…
          </div>
        ) : (
          <div style={{ background: 'rgba(14,14,26,0.95)' }}>
            {platforms.map((p, idx) => {
              const connected = connections[p.key].connected;
              const isActing = actionPlatform === p.key;
              const isLast = idx === platforms.length - 1;

              return (
                <div key={p.key}
                  className="flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-5 transition-all duration-200"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    background: connected ? 'rgba(16,40,20,0.4)' : undefined,
                  }}>
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${p.iconBg}`}>
                    {p.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-200">{p.label}</span>
                      {connected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                          ACTIF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{p.desc}</p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {connected && <AccountBadge platform={p.key} state={connections} />}

                    {connected ? (
                      <button
                        onClick={() => handleDisconnect(p.key)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-red-400 transition disabled:opacity-40"
                        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                        {isActing
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <LogOut className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Déconnecter</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setGuideModal(p.key)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                        style={{ background: p.color === '#555' ? 'rgba(255,255,255,0.1)' : p.color }}>
                        Connecter
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="px-5 sm:px-7 py-4 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.04)', borderTop: '1px solid rgba(245,158,11,0.1)' }}>
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-500/70 leading-relaxed">
            <strong>Protection anti-ban :</strong> Les publications se font via l&apos;API officielle au niveau <em>Page</em> (jamais votre profil perso). En mode Sandbox, aucune connexion réelle n&apos;est établie — tout est simulé localement.
          </p>
        </div>
      </div>

      {/* ── API Keys & Developer Credentials ── */}
      <form onSubmit={handleSaveCredentials} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 sm:px-7 py-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-gray-100">Configuration des Clés API & Identifiants</h3>
            </div>
            <button
              type="submit"
              disabled={isSavingCreds}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 active:scale-95 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSavingCreds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Enregistrer les modifications
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1.5 ml-6">Saisissez vos clés privées. Elles sont stockées de façon sécurisée en base de données et ne quittent jamais votre serveur.</p>
        </div>

        <div className="p-5 sm:p-7 space-y-5" style={{ background: 'rgba(14,14,26,0.95)' }}>
          {/* Gemini */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-blue-500/20 text-[#4285F4]">G</span>
                Google Gemini API Key
              </label>
              {connections.credentials?.geminiApiKeyConfigured ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  ✓ Configurée (Base de données)
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-950/80 border border-amber-500/30 text-amber-300">
                  ⚠ Non configurée (Mode Simulation actif)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={connections.credentials?.geminiApiKey || "AIzaSy..."}
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                className="input-field text-sm font-mono"
              />
            </div>
            <p className="text-xs text-gray-600">
              Recommandée pour activer la génération d&apos;images haute fidélité <strong className="text-gray-500">Google Imagen 3</strong> et les descriptions de publications.
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                className="text-purple-400 hover:underline inline-flex items-center gap-0.5 ml-1">
                Obtenir une clé gratuite sur Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* Replicate */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-semibold text-gray-300">
                Replicate Token (Vidéos Kling AI / Luma)
              </label>
              {connections.credentials?.replicateTokenConfigured ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  ✓ Configuré
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-950/80 border border-amber-500/30 text-amber-300">
                  🧪 Simulation (Vidéos démo locales Mixkit)
                </span>
              )}
            </div>
            <input
              type="password"
              placeholder={connections.credentials?.replicateToken || "r8_..."}
              value={replicateToken}
              onChange={e => setReplicateToken(e.target.value)}
              className="input-field text-sm font-mono"
            />
            <p className="text-xs text-gray-600">
              Nécessaire pour lancer de vraies générations de vidéos IA.
              <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer"
                className="text-purple-400 hover:underline inline-flex items-center gap-0.5 ml-1">
                Obtenir un token Replicate <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* Meta & TikTok Developer OAuth section */}
          <div className="rounded-xl p-4 space-y-4"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(24,119,242,0.15)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-sm font-semibold text-gray-300 block">Identifiants OAuth (Facebook, Instagram, TikTok)</label>
                <span className="text-[10px] text-gray-500 block mt-0.5">Pour raccordement réel de production</span>
              </div>
              {connections.credentials?.facebookClientIdConfigured || connections.credentials?.tiktokClientIdConfigured ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-950/80 border border-blue-500/30 text-blue-300">
                  ⚙️ Mode Réel Disponible
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-950/80 border border-purple-500/30 text-purple-300">
                  🧪 Mode Simulation Actif
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              Laissez ces champs vides pour utiliser la **Simulation interactive haute-fidélité** (Sandbox). Pour lier vos vrais comptes en production, créez des applications sur les portails développeurs respectifs et renseignez vos identifiants ici :
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-400">Meta (Facebook & Instagram)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    placeholder={connections.credentials?.facebookClientId || "FACEBOOK_CLIENT_ID"}
                    value={facebookClientId}
                    onChange={e => setFacebookClientId(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                  <input
                    type="password"
                    placeholder={connections.credentials?.facebookClientSecret || "FACEBOOK_CLIENT_SECRET"}
                    value={facebookClientSecret}
                    onChange={e => setFacebookClientSecret(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-gray-400">TikTok Developer Portal</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    placeholder={connections.credentials?.tiktokClientId || "TIKTOK_CLIENT_KEY"}
                    value={tiktokClientId}
                    onChange={e => setTiktokClientId(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                  <input
                    type="password"
                    placeholder={connections.credentials?.tiktokClientSecret || "TIKTOK_CLIENT_SECRET"}
                    value={tiktokClientSecret}
                    onChange={e => setTiktokClientSecret(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-1 flex-wrap">
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Créer App Meta Developers
              </a>
              <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> TikTok Developers Portal
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
