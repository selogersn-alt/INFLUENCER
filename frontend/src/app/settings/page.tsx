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
              className={`px-6 py-2 rounded-lg font-medium transition ${connected.instagram ? 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90'}`}
            >
              {connected.instagram ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Facebook */}
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Facebook className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-200">Facebook Page</h4>
                <p className="text-sm text-gray-500">Publish generated videos to Facebook Reels.</p>
              </div>
            </div>
            <button 
              onClick={() => toggleConnection('facebook')}
              className={`px-6 py-2 rounded-lg font-medium transition ${connected.facebook ? 'bg-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {connected.facebook ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* TikTok */}
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black border border-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.41-5.46.02-2.38 1.31-4.51 3.39-5.61 1.25-.66 2.69-.96 4.11-.84v4.06c-1.32-.08-2.65.41-3.51 1.33-.91.95-1.16 2.4-.66 3.63.47 1.12 1.62 1.9 2.86 1.92 1.45.03 2.75-.92 3.13-2.31.14-.52.16-1.07.16-1.61V.02z"/></svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-200">TikTok Account</h4>
                <p className="text-sm text-gray-500">Publish via TikTok Direct Post API.</p>
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
