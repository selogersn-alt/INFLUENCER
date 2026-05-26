"use client";

import { useState, useRef } from 'react';
import { ImageIcon, Sparkles, Download, Wand2, Loader2, X, ChevronRight, Copy, Check } from 'lucide-react';
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
  const [style, setStyle] = useState<StyleKey>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const aspectClass = ASPECT_RATIOS.find(a => a.value === aspectRatio)?.css || 'aspect-square';

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter">
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
          Powered by <span className="text-purple-400 font-semibold">Google Imagen 3</span> via Gemini API
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="xl:col-span-5 space-y-4">
          {/* Prompt Input */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-200">Décris ton image</label>
              <button
                onClick={handleCopyPrompt}
                disabled={!prompt}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition disabled:opacity-0"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
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
            <p className="text-xs text-gray-600">Ctrl+Entrée pour générer</p>
          </div>

          {/* Quick prompts */}
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(17,17,27,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Inspirations rapides</p>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(qp)}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-200 py-2 px-3 rounded-lg hover:bg-white/5 transition flex items-start gap-2 group"
                >
                  <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                  <span className="line-clamp-1">{qp}</span>
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
                <p className="text-gray-500 text-sm max-w-xs">Cela prend généralement 5 à 15 secondes selon la complexité du prompt.</p>
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
                <p className="text-gray-500 text-sm max-w-sm">{error}</p>
                <button onClick={() => setError(null)} className="btn-secondary text-sm mt-2">Réessayer</button>
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
                      <Sparkles className="w-3 h-3" /> {modelUsed}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage, images.indexOf(selectedImage))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <Link
                    href={`/create?imageData=${encodeURIComponent(selectedImage.dataUrl)}`}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', backdropFilter: 'blur(10px)' }}
                  >
                    Créer vidéo →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-16 px-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center">
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
