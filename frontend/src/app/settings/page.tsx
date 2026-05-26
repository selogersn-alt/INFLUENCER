"use client";

import { useState } from 'react';
import { Facebook, Instagram, Twitter, Shield, Link2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [connected, setConnected] = useState({
    instagram: true,
    facebook: false,
    tiktok: false
  });

  const toggleConnection = (platform: keyof typeof connected) => {
    // In a real app, this would redirect to the OAuth provider
    setConnected(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Shield className="w-8 h-8 text-purple-400" />
          Settings & Integrations
        </h2>
        <p className="text-gray-400 mt-2">Manage your AI Influencer's social media accounts and API keys.</p>
      </header>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-gray-400" />
          Social Media Accounts
        </h3>
        
        <div className="space-y-4">
          {/* Instagram */}
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-200">Instagram Reels</h4>
                <p className="text-sm text-gray-500">Publish generated videos to Instagram.</p>
              </div>
            </div>
            <button 
              onClick={() => toggleConnection('instagram')}
          {/* Facebook */}
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1877F2]" />
              </div>
              <div>
                <h4 className="font-bold text-gray-200">Facebook Page</h4>
                <p className="text-sm text-gray-500">Auto-publish Reels</p>
              </div>
            </div>
            <button 
              onClick={() => toggleConnection('facebook')}
              className={`px-6 py-2 rounded-lg font-medium transition ${connected.facebook ? 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {connected.facebook ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Instagram */}
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-80 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-200">Instagram Professional</h4>
                <p className="text-sm text-gray-500">Auto-publish Reels & Stories</p>
              </div>
            </div>
            <button 
              onClick={() => toggleConnection('instagram')}
              className={`px-6 py-2 rounded-lg font-medium transition ${connected.instagram ? 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90'}`}
            >
              {connected.instagram ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* TikTok */}
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-200">TikTok Account</h4>
                <p className="text-sm text-gray-500">Auto-publish TikToks</p>
              </div>
            </div>
            <button 
              onClick={() => toggleConnection('tiktok')}
              className={`px-6 py-2 rounded-lg font-medium transition ${connected.tiktok ? 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-gray-100 text-black hover:bg-gray-300'}`}
            >
              {connected.tiktok ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>

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
