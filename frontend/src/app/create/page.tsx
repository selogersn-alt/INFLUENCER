"use client";

import { useState, useEffect } from 'react';
import {
  UploadCloud, Image as ImageIcon, Video, Play, Loader2,
  Sparkles, Heart, MessageCircle, Send, Bookmark, Music,
  RefreshCw, CheckCircle2, AlertCircle, Smartphone, Edit3, Check
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ConnectedState {
  facebook: { connected: boolean; pageName?: string; pageId?: string };
  instagram: { connected: boolean; username?: string; accountId?: string };
  tiktok: { connected: boolean; username?: string };
}

export default function CreateVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("kling");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Advanced configurations
  const [tone, setTone] = useState("aesthetic");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram']);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  // Mock profile states (loaded from settings / state)
  const [profile, setProfile] = useState<ConnectedState>({
    facebook: { connected: false },
    instagram: { connected: false },
    tiktok: { connected: false },
  });

  // Generated captions per platform
  const [title, setTitle] = useState("");
  const [captions, setCaptions] = useState<Record<string, { caption: string; hashtags: string }>>({
    tiktok: { caption: "Bienvenue dans mon univers ✨ Prêt(e) à découvrir de nouveaux horizons aujourd'hui ?", hashtags: "#PourToi #fyp #lifestyle" },
    instagram: { caption: "Vivre chaque instant pleinement 🌸 Trouver la poésie dans les détails simples du quotidien.", hashtags: "#InstaGood #OOTD #Aesthetic" },
    facebook: { caption: "Nouveau look pour une nouvelle aventure ! Qu'en pensez-vous ? Laissez vos avis en commentaires !", hashtags: "#FacebookReels #Style" },
  });
  
  // Current active preview platform in the phone simulator
  const [previewPlatform, setPreviewPlatform] = useState<'tiktok' | 'instagram' | 'facebook'>('tiktok');
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch linked account info on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings/state`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          // Pre-select platforms based on connection
          const active: string[] = [];
          if (data.tiktok?.connected) active.push('tiktok');
          if (data.instagram?.connected) active.push('instagram');
          if (data.facebook?.connected) active.push('facebook');
          if (active.length > 0) setSelectedPlatforms(active);
        }
      } catch { /* silent */ }
    };
    fetchProfile();
  }, []);

  // Update text editor states when preview platform changes
  useEffect(() => {
    const current = captions[previewPlatform] || { caption: "", hashtags: "" };
    setEditedCaption(current.caption);
    setEditedHashtags(current.hashtags);
  }, [previewPlatform, captions]);

  // Prompt Optimizer (Magic Wand)
  const handleOptimizePrompt = async () => {
    if (!prompt.trim() || prompt.length < 3) {
      showNotification('error', "Veuillez écrire un prompt de base d'au moins 3 caractères.");
      return;
    }
    setIsOptimizingPrompt(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate-text/optimize-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'video' })
      });
      const data = await res.json();
      if (data.success && data.optimizedPrompt) {
        setPrompt(data.optimizedPrompt);
        showNotification('success', "Prompt optimisé avec succès via Gemini ! ✨");
      } else {
        showNotification('error', data.error || "L'optimisation a échoué.");
      }
    } catch {
      showNotification('error', "Erreur réseau.");
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  // AI Text caption generator (Multi-platform / Tone aware)
  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      showNotification('error', "Veuillez d'abord écrire un prompt vidéo.");
      return;
    }
    setIsGeneratingText(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPrompt: prompt,
          tone,
          platforms: selectedPlatforms
        })
      });
      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        setTitle(responseData.data.title || "Nouvelle Publication");
        
        // Merge generated captions with defaults
        const newCaptions = { ...captions };
        Object.keys(responseData.data.posts).forEach(key => {
          newCaptions[key] = responseData.data.posts[key];
        });
        setCaptions(newCaptions);
        
        showNotification('success', "Textes et légendes IA générés avec succès ! ✓");
      } else {
        showNotification('error', responseData.error || "Génération de texte échouée.");
      }
    } catch {
      showNotification('error', "Erreur de connexion au serveur.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Save manual text edit
  const handleSaveTextEdit = () => {
    setCaptions({
      ...captions,
      [previewPlatform]: {
        caption: editedCaption,
        hashtags: editedHashtags
      }
    });
    setIsEditingText(false);
    showNotification('success', "Légende mise à jour !");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setVideoUrl(null);
    }
  };

  // Video generator launcher
  const handleGenerate = async () => {
    if (!file || !prompt) return;
    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', prompt);
      formData.append('model', model);

      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        body: formData
      });

      const responseData = await res.json();

      if (!responseData.success || !responseData.predictionId) {
        showNotification('error', responseData.error || "Impossible de lancer la génération vidéo.");
        setIsGenerating(false);
        return;
      }

      const predictionId = responseData.predictionId;
      showNotification('success', "Génération lancée ! Préparation de votre vidéo...");

      // Polling
      const checkStatus = async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/api/generate/status/${predictionId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'succeeded') {
            const finalUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            setVideoUrl(finalUrl);
            setIsGenerating(false);
            showNotification('success', "Vidéo générée avec succès ! ✨");
          } else if (statusData.status === 'failed' || statusData.status === 'canceled') {
            showNotification('error', "Échec de génération : " + (statusData.error || "Erreur serveur."));
            setIsGenerating(false);
          } else {
            setTimeout(checkStatus, 4000);
          }
        } catch {
          setTimeout(checkStatus, 5000);
        }
      };

      setTimeout(checkStatus, 4000);
    } catch {
      showNotification('error', "Erreur de connexion.");
      setIsGenerating(false);
    }
  };

  // Dynamic values helper based on platform preview
  const getSimulatedAccount = () => {
    if (previewPlatform === 'tiktok') {
      return {
        username: (profile.tiktok?.connected && profile.tiktok.username) ? `@${profile.tiktok.username}` : '@influenceuse_ia',
        pageName: 'TikTok Feed',
        avatarBg: 'bg-zinc-800'
      };
    }
    if (previewPlatform === 'instagram') {
      return {
        username: (profile.instagram?.connected && profile.instagram.username) ? `@${profile.instagram.username}` : '@lina_lifestyle_ai',
        pageName: 'Instagram Reels',
        avatarBg: 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600'
      };
    }
    return {
      username: (profile.facebook?.connected && profile.facebook.pageName) ? profile.facebook.pageName : 'Lina Lifestyle Officiel',
      pageName: 'Facebook Page',
      avatarBg: 'bg-blue-600'
    };
  };

  const accountInfo = getSimulatedAccount();
  const currentCaption = captions[previewPlatform] || { caption: "", hashtags: "" };

  return (
    <div className="max-w-6xl mx-auto space-y-8 page-enter pb-32 lg:pb-0">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto sm:min-w-80 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
          ${notification.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/90 border-red-500/30 text-red-300'}`}
          style={{ backdropFilter: 'blur(20px)' }}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-600">
            <Video className="w-5 h-5 text-white" />
          </div>
          Studio de Création IA
        </h2>
        <p className="text-gray-500 mt-1.5 text-sm sm:text-base">
          Générez une vidéo, rédigez vos légendes multi-plateformes et visualisez le rendu final sur mobile.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image, Prompt & AI parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reference Image Container */}
          <div className="rounded-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[300px] border"
            style={{ background: 'rgba(17,17,27,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {videoUrl ? (
              <div className="w-full h-full relative">
                <video src={videoUrl} controls autoPlay loop className="w-full h-80 object-cover rounded-xl shadow-2xl" />
                <button
                  onClick={() => setVideoUrl(null)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition border border-white/10"
                >
                  Générer une autre vidéo
                </button>
              </div>
            ) : preview ? (
              <div className="w-full h-full relative">
                <img src={preview} alt="Reference avatar" className="w-full h-80 object-cover rounded-xl" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-3 right-3 bg-red-950/80 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-200 text-xs font-bold hover:bg-red-900 transition"
                >
                  Remplacer l&apos;image
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl cursor-pointer hover:bg-white/[0.02] transition"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-12 h-12 text-gray-500 mb-3" />
                  <p className="mb-1 text-sm text-gray-300"><span className="font-semibold text-purple-400">Cliquez pour importer</span> l&apos;image</p>
                  <p className="text-xs text-gray-600">PNG, JPG, JPEG (Max 10Mo)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Action Prompt */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-200">Description de l&apos;Action (Prompt Vidéo)</label>
              <button
                onClick={handleOptimizePrompt}
                disabled={isOptimizingPrompt || !prompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition disabled:opacity-30 disabled:pointer-events-none"
              >
                {isOptimizingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                ✨ Baguette Magique (Optimiser)
              </button>
            </div>
            
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: L'influenceuse marche avec élégance dans les rues illuminées de Tokyo, souriant à la caméra. Cadrage portrait vertical, grain de film doux..."
              className="input-field resize-none text-sm"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Modèle IA</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input-field text-xs select-field"
                >
                  <option value="kling">Kling AI v1.5 (Plus fluide)</option>
                  <option value="luma">Luma Dream Machine (Dynamique)</option>
                  <option value="runway">Runway Gen-3 (Très stable)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tonalité Légende</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="input-field text-xs select-field"
                >
                  <option value="aesthetic">👗 Esthétique / Vogue</option>
                  <option value="hype">🚀 Hype / Énergie</option>
                  <option value="humorous">🎭 Drôle / Taquin</option>
                  <option value="mysterious">🌌 Mystérieux / Profond</option>
                  <option value="engaging">💬 Interactif / Débat</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Destinations de publication</label>
              <div className="flex gap-4">
                {['tiktok', 'instagram', 'facebook'].map(plat => (
                  <label key={plat} className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(plat)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPlatforms([...selectedPlatforms, plat]);
                        else setSelectedPlatforms(selectedPlatforms.filter(p => p !== plat));
                      }}
                      className="rounded accent-purple-500 bg-zinc-950 border-zinc-800"
                    />
                    <span className="capitalize">{plat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action trigger button */}
          <button
            onClick={handleGenerate}
            disabled={!file || !prompt || isGenerating}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
              !file || !prompt
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                : isGenerating
                  ? 'bg-purple-600/50 text-white cursor-wait'
                  : 'bg-gradient-to-r from-purple-500 via-pink-600 to-orange-500 hover:opacity-90 active:scale-[0.99] text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération de la vidéo en cours...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Générer la vidéo & Placer en File d&apos;attente
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live mobile smartphone simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900/40 rounded-2xl p-6 border flex flex-col items-center justify-center"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            
            {/* Phone Selector tabs */}
            <div className="flex bg-black/40 rounded-xl p-1 w-full max-w-[320px] mb-5 border border-white/5">
              {(['tiktok', 'instagram', 'facebook'] as const).map(plat => (
                <button
                  key={plat}
                  onClick={() => setPreviewPlatform(plat)}
                  className={`flex-1 text-[11px] font-bold py-2 rounded-lg transition capitalize ${
                    previewPlatform === plat ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            {/* Smartphone simulator chassis */}
            <div className="w-[300px] h-[580px] rounded-[48px] p-3 bg-zinc-950 border-4 border-zinc-800 shadow-2xl relative flex flex-col overflow-hidden select-none">
              {/* Speaker Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-black rounded-full mb-1" />
              </div>

              {/* Screen Area */}
              <div className="w-full h-full rounded-[38px] bg-zinc-900 relative overflow-hidden flex flex-col">
                
                {/* Simulated Content / Video / Image */}
                <div className="absolute inset-0 z-0">
                  {videoUrl ? (
                    <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : preview ? (
                    <img src={preview} alt="Visual cover preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-center px-6">
                      <ImageIcon className="w-10 h-10 text-gray-700 mb-3" />
                      <p className="text-xs text-gray-500 leading-relaxed">Importez une photo et tapez votre prompt pour voir l&apos;aperçu s&apos;afficher en direct</p>
                    </div>
                  )}
                  {/* Black dark overlay gradient in bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 to-transparent z-10" />
                </div>

                {/* ─── TIKTOK SIMULATOR MOCKUP ─── */}
                {previewPlatform === 'tiktok' && (
                  <div className="w-full h-full flex flex-col justify-between p-4 z-20 relative text-white">
                    {/* Top indicators */}
                    <div className="flex justify-between items-center text-[10px] font-bold px-2 pt-4">
                      <span>9:41</span>
                      <div className="flex gap-1.5">
                        <span>Abonnements</span>
                        <span className="border-b-2 border-white pb-0.5 font-extrabold">Pour toi</span>
                      </div>
                      <div className="w-4 h-4" />
                    </div>

                    {/* Right side interaction floating panel */}
                    <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 text-center">
                      {/* Avatar */}
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white uppercase ${accountInfo.avatarBg}`}>
                          {accountInfo.username.substring(1, 3)}
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">+</div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <Heart className="w-6 h-6 fill-white" />
                        <span className="text-[10px] font-bold mt-1">4.2K</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <MessageCircle className="w-6 h-6 fill-white" />
                        <span className="text-[10px] font-bold mt-1">291</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Bookmark className="w-6 h-6 fill-white" />
                        <span className="text-[10px] font-bold mt-1">112</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Send className="w-5 h-5" />
                        <span className="text-[10px] font-bold mt-1">Share</span>
                      </div>
                    </div>

                    {/* Bottom left caption panel */}
                    <div className="w-full pr-12 pb-2 space-y-1.5 self-end">
                      <span className="font-bold text-sm block">{accountInfo.username}</span>
                      <p className="text-xs text-gray-200 leading-normal line-clamp-3">
                        {currentCaption.caption} <span className="text-purple-400 font-bold block mt-1">{currentCaption.hashtags}</span>
                      </p>
                      
                      {/* Spinning audio disc */}
                      <div className="flex items-center gap-2 pt-2">
                        <Music className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                        <span className="text-[10px] text-gray-300 truncate w-28">Son original - AI Studio Engine</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── INSTAGRAM REELS SIMULATOR ─── */}
                {previewPlatform === 'instagram' && (
                  <div className="w-full h-full flex flex-col justify-between p-4 z-20 relative text-white">
                    {/* Top indicators */}
                    <div className="flex justify-between items-center text-[11px] font-bold pt-4">
                      <span className="font-extrabold text-base tracking-tight">Reels</span>
                      <ImageIcon className="w-5 h-5" />
                    </div>

                    {/* Right side Reels buttons */}
                    <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-center">
                      <div className="flex flex-col items-center">
                        <Heart className="w-5 h-5 hover:scale-110 transition" />
                        <span className="text-[10px] mt-1 font-semibold">12K</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <MessageCircle className="w-5 h-5 hover:scale-110 transition" />
                        <span className="text-[10px] mt-1 font-semibold">89</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Send className="w-5 h-5 hover:scale-110 transition" />
                      </div>

                      <div className="flex flex-col items-center">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      
                      <div className="w-7 h-7 rounded bg-zinc-800 border-2 border-white flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-cover" style={{ backgroundImage: preview ? `url(${preview})` : undefined }} />
                      </div>
                    </div>

                    {/* Bottom details */}
                    <div className="w-full pr-12 pb-2 self-end space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white uppercase ${accountInfo.avatarBg}`}>
                          {accountInfo.username.substring(1, 3)}
                        </div>
                        <span className="font-semibold text-xs">{accountInfo.username}</span>
                        <span className="text-[10px] border border-white/30 px-2 py-0.5 rounded font-bold">Suivre</span>
                      </div>
                      
                      <p className="text-[11px] text-gray-200 leading-normal line-clamp-3">
                        {currentCaption.caption} <span className="text-blue-400 block mt-0.5">{currentCaption.hashtags}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ─── FACEBOOK REELS SIMULATOR ─── */}
                {previewPlatform === 'facebook' && (
                  <div className="w-full h-full flex flex-col justify-between p-4 z-20 relative text-white">
                    {/* Top bar */}
                    <div className="flex justify-between items-center text-[10px] font-bold pt-4">
                      <span>Facebook Reels</span>
                      <ImageIcon className="w-4 h-4" />
                    </div>

                    {/* Right side floating */}
                    <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-center">
                      <div className="flex flex-col items-center">
                        <Heart className="w-5 h-5 fill-blue-500 text-blue-500" />
                        <span className="text-[9px] mt-1">2.4K</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[9px] mt-1">110</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <Send className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Bottom area */}
                    <div className="w-full pr-12 pb-2 self-end space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase ${accountInfo.avatarBg}`}>
                          {accountInfo.username.substring(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-xs block leading-tight">{accountInfo.username}</span>
                          <span className="text-[9px] text-gray-400">Reels</span>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-gray-100 leading-normal line-clamp-2">
                        {currentCaption.caption} <span className="text-blue-400 block font-semibold">{currentCaption.hashtags}</span>
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Simulated interactive caption editor */}
            <div className="w-full mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Éditeur de légende ({previewPlatform})
                </span>
                
                {!isEditingText ? (
                  <button
                    onClick={() => setIsEditingText(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Modifier
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingText(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-400 font-bold transition"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveTextEdit}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Valider
                    </button>
                  </div>
                )}
              </div>

              {isEditingText ? (
                <div className="space-y-2 p-3 bg-black/20 rounded-xl border border-white/5">
                  <textarea
                    rows={2}
                    value={editedCaption}
                    onChange={e => setEditedCaption(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={editedHashtags}
                    onChange={e => setEditedHashtags(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-white/10 rounded-lg p-2 text-xs text-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl border"
                  style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    &ldquo;{currentCaption.caption}&rdquo;
                  </p>
                  <p className="text-xs text-purple-400 font-bold mt-2">
                    {currentCaption.hashtags}
                  </p>
                </div>
              )}
              
              <button
                onClick={handleGenerateText}
                disabled={isGeneratingText || !prompt}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700/80 active:scale-[0.99] text-xs font-bold text-zinc-200 rounded-xl transition flex items-center justify-center gap-1.5 border border-white/5 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isGeneratingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Générer les légendes par IA (Gemini)
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
