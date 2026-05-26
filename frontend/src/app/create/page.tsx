"use client";

import { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Video, Play, Loader2 } from 'lucide-react';

export default function CreateVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  const handleGenerateText = async () => {
    if (!prompt) {
      alert("Veuillez d'abord écrire un prompt vidéo pour que l'IA puisse s'en inspirer.");
      return;
    }
    setIsGeneratingText(true);
    
    try {
      const res = await fetch("http://localhost:3001/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPrompt: prompt })
      });
      
      const responseData = await res.json();
      
      if (responseData.success && responseData.data) {
        setTitle(responseData.data.title);
        setDescription(responseData.data.description);
        setHashtags(responseData.data.hashtags);
      } else {
        alert("Erreur lors de la génération: " + (responseData.error || "Réponse invalide"));
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion au serveur Backend.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleGenerate = async () => {
    if (!file || !prompt) return;
    setIsGenerating(true);
    // TODO: Connect to backend API for generation
    setTimeout(() => {
      setIsGenerating(false);
      alert("Simulation : Vidéo générée avec succès ! (Backend à connecter)");
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Video className="w-8 h-8 text-purple-400" />
          Create New Content
        </h2>
        <p className="text-gray-400 mt-2">Upload your influencer's photo, describe the scene, and let AI generate the video and captions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Upload & Video Prompt */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-6 flex flex-col items-center justify-center relative overflow-hidden group min-h-[300px]">
            {preview ? (
              <div className="w-full h-full relative">
                <img src={preview} alt="Reference" className="w-full h-80 object-cover rounded-xl" />
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-gray-900/80 p-2 rounded-full hover:bg-red-500/80 transition text-white"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-gray-800 border-dashed rounded-xl cursor-pointer bg-gray-800/20 hover:bg-gray-800/50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-12 h-12 text-gray-500 mb-4 group-hover:text-purple-400 transition" />
                  <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-purple-400">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max 10MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-6">
            <label className="block text-sm font-bold text-gray-200 mb-2">Video Prompt / Action (For Kling AI)</label>
            <textarea 
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. The influencer is dancing smoothly to a trendy pop song in a high-end Parisian restaurant. Cinematic lighting, photorealistic."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
            ></textarea>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">AI Video Model</label>
              <select className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition appearance-none">
                <option value="gemini_veo">Google Veo (Gemini) - High Cinematic</option>
                <option value="kling">Kling AI (Best for Lifestyle & Dance)</option>
                <option value="runway">Runway Gen-3 (High Fidelity)</option>
                <option value="luma">Luma Dream Machine (Dynamic)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Social Media Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-200">Social Media Post</h3>
              <button 
                onClick={handleGenerateText}
                disabled={isGeneratingText}
                className="text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:opacity-90 transition"
              >
                {isGeneratingText ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨ Auto-Generate text"}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Title (TikTok/YouTube)</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Caption / Description</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Hashtags</label>
              <input 
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-blue-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!file || !prompt || isGenerating}
              className={`w-full py-4 mt-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                !file || !prompt 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : isGenerating 
                    ? 'bg-purple-600/50 text-white cursor-wait'
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/25'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Generate Video & Send to Queue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
