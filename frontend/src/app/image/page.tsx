"use client";

import { useState, useRef } from 'react';
import { ImageIcon, Sparkles, Download, Wand2, Loader2, X, ChevronRight, Copy, Check, Info } from 'lucide-react';
import Link from 'next/link';

type AspectRatio = '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
type StyleKey = 'none' | 'photorealistic' | 'artistic' | 'anime' | 'fashion' | 'cinematic';

interface GeneratedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string; css: string }[] = [
  { value: '1:1', label: 'Carré', css: 'aspect-square' },
  { value: '9:16', label: 'Portrait', css: 'aspect-[9/16]' },
  { value: '16:9', label: 'Paysage', css: 'aspect-video' },
  { value: '4:3', label: '4:3', css: 'aspect-[4/3]' },
  { value: '3:4', label: '3:4', css: 'aspect-[3/4]' },
];

const STYLES: { value: StyleKey; label: string; emoji: string; desc: string }[] = [
  { value: 'none', label: 'Auto', emoji: '✨', desc: 'Laisse l\'IA choisir' },
  { value: 'photorealistic', label: 'Photo', emoji: '📸', desc: 'Rendu ultra-réaliste 8K' },
  { value: 'fashion', label: 'Fashion', emoji: '👗', desc: 'Style éditorial Vogue' },
  { value: 'cinematic', label: 'Cinéma', emoji: '🎬', desc: 'Qualité film professionnel' },
  { value: 'artistic', label: 'Art', emoji: '🎨', desc: 'Digital art & illustration' },
  { value: 'anime', label: 'Anime', emoji: '⛩️', desc: 'Style manga / Studio Ghibli' },
];

const QUICK_PROMPTS = [
  'Influenceuse mode à Paris, robe élégante, Champs-Élysées au coucher du soleil',
  'Photo lifestyle influenceuse en terrasse de café, Paris haussmannien',
  'Portrait studio influenceuse IA, lumière professionnelle, fond neutre',
  'Influenceuse fitness dans une salle de sport moderne, tenue sportive',
  'Beauty shot gros plan visage, maquillage parfait, lumière dorée',
  'Influenceuse voyage, plage tropicale, coucher de soleil spectaculaire',
];

export default function ImageGeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<StyleKey>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Magic Wand Prompt Enhancer
  const handleOptimizePrompt = async () => {
    if (!prompt.trim() || prompt.length < 3) {
      showToast("Veuillez d'abord écrire un prompt d'au moins 3 caractères.");
      return;
    }
    setIsOptimizingPrompt(true);
    try {
      const res = await fetch('/api/generate-text/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'image' })
      });
      const data = await res.json();
      if (data.success && data.optimizedPrompt) {
        setPrompt(data.optimizedPrompt);
        showToast("Prompt optimisé pour Imagen 3 ! ✨");
      } else {
        showToast(data.error || "L'optimisation a échoué.");
      }
    } catch {
      showToast("Erreur de connexion.");
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setImages([]);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          style: style === 'none' ? undefined : style,
          aspectRatio,
          numberOfImages: count,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'La génération a échoué.');
      } else {
        setImages(data.images);
        setModelUsed(data.model);
        if (data.images.length > 0) setSelectedImage(data.images[0]);
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion au backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImage, index: number) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = `ai-studio-image-${Date.now()}-${index + 1}.png`;
    a.click();
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickPrompt = (qp: string) => {
    setPrompt(qp);
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter pb-32 lg:pb-0">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 bg-purple-950/90 border border-purple-500/30 text-purple-200 rounded-2xl shadow-2xl text-sm font-semibold animate-in fade-in slide-in-from-top-3 duration-300"
          style={{ backdropFilter: 'blur(20px)' }}>
          <Sparkles className="w-4 h-4 text-purple-400" />
          {notification}
        </div>
      )}

      {/* Header */}
      <header>
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          Génération d&apos;Image IA
        </h2>
        <p className="text-gray-400 mt-1.5 text-sm sm:text-base">
          Propulsé par <span className="text-purple-400 font-semibold">Google Imagen 3</span> avec optimisations en temps réel.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="xl:col-span-5 space-y-4">
          {/* Prompt Input */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-200">Décris ton image</label>
              
              <div className="flex gap-3">
                <button
                  onClick={handleOptimizePrompt}
                  disabled={isOptimizingPrompt || !prompt}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold transition disabled:opacity-30"
                >
                  {isOptimizingPrompt ? <Loader2 className="w-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Optimiser (Gemini)
                </button>

                <button
                  onClick={handleCopyPrompt}
                  disabled={!prompt}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition disabled:opacity-0"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
            
            <textarea
              ref={textareaRef}
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ex: Influenceuse mode à Paris, robe rouge élégante, lumière dorée au coucher du soleil..."
              className="input-field resize-none text-sm"
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate(); }}
            />

            {/* Negative Prompt */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Prompt Négatif (À exclure)</label>
              <input
                type="text"
                placeholder="Ex: flou, déformation, texte, mauvaise qualité..."
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                className="input-field text-xs font-mono"
              />
            </div>
            <p className="text-xs text-gray-600">Ctrl+Entrée pour générer</p>
          </div>

          {/* Quick prompts */}
          <div className="rounded-2xl p-4 space-y-2.5" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Inspirations rapides</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(qp)}
                  className="text-[11px] bg-white/3 hover:bg-purple-500/10 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 text-gray-400 active:scale-[0.97]"
                >
                  {qp.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Style visuel</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                    style === s.value
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      : 'bg-white/3 border border-white/5 text-gray-400 hover:bg-white/6 hover:text-gray-200'
                  }`}
                >
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
            
            <p className="text-[10px] text-gray-500 mt-3 text-center italic leading-relaxed border-t border-white/5 pt-2">
              ℹ️ Style {STYLES.find(s => s.value === style)?.label} : {STYLES.find(s => s.value === style)?.desc}
            </p>
          </div>

          {/* Format & Count */}
          <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Format</p>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map(ar => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      aspectRatio === ar.value
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                        : 'bg-white/5 border border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {ar.label} <span className="opacity-50">{ar.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nombre d&apos;images : <span className="text-purple-400">{count}</span>
              </p>
              <input
                type="range"
                min={1} max={4} step={1}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="btn-primary w-full py-4 text-base"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Génération en cours…</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Générer {count > 1 ? `${count} images` : "l'image"}</>
            )}
          </button>
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-7 space-y-4">
          {/* Main preview */}
          <div
            className="rounded-2xl overflow-hidden relative flex items-center justify-center"
            style={{
              background: 'rgba(17,17,27,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '320px',
            }}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4 py-16 px-8 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                    <Sparkles className="w-8 h-8 text-white float" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl pulse-glow" />
                </div>
                <p className="text-gray-300 font-medium">Imagen 3 génère votre image…</p>
                <p className="text-gray-500 text-sm max-w-xs">Génération via Gemini API. Cela prend généralement 5 à 10 secondes.</p>
                <div className="w-48 h-1 rounded-full overflow-hidden bg-gray-800">
                  <div className="h-full shimmer" style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-12 px-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-400 font-medium">Génération échouée</p>
                <div className="flex items-start gap-2 max-w-sm p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-left">
                  <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-xs leading-normal">{error}</p>
                </div>
                
                <p className="text-[11px] text-gray-500 max-w-xs mt-2">
                  Si le message indique que votre clé a été bloquée pour fuite (Leaked Key), rendez-vous dans les <strong>Paramètres</strong> pour enregistrer une nouvelle clé API Gemini privée.
                </p>
                <button onClick={handleGenerate} className="btn-secondary text-sm mt-3 px-6 py-2.5">Réessayer</button>
              </div>
            ) : selectedImage ? (
              <div className="relative w-full">
                <img
                  src={selectedImage.dataUrl}
                  alt="Generated"
                  className="w-full object-contain rounded-xl"
                  style={{ maxHeight: '500px' }}
                />
                {modelUsed && (
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-info text-xs">
                      <Sparkles className="w-3 h-3 animate-pulse" /> {modelUsed}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage, images.indexOf(selectedImage))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-black/60 hover:bg-black/80 border border-white/10"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <Link
                    href={`/create?imageData=${encodeURIComponent(selectedImage.dataUrl)}`}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Créer vidéo →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-16 px-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center border border-white/5">
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">Vos images générées apparaîtront ici</p>
                <p className="text-gray-600 text-xs">Écrivez un prompt et cliquez sur Générer</p>
              </div>
            )}
          </div>

          {/* Thumbnails gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    selectedImage === img ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-950' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.dataUrl} alt={`Generated ${i + 1}`} className="w-full aspect-square object-cover" />
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(img, i); }}
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <Download className="w-3 h-3 text-white" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
