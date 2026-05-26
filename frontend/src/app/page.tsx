"use client";

import { useEffect, useState } from 'react';
import { Video, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type StatsData = {
  totalVideos: number;
  pendingApproval: number;
  publishedCount: number;
  recent: Array<{
    id: string;
    title: string;
    thumbnail: string;
    videoUrl: string | null;
    status: 'PENDING_APPROVAL' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'GENERATING';
    createdAt: string;
  }>;
};

export default function Home() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="text-gray-400 text-sm">Chargement des données du tableau de bord...</p>
      </div>
    );
  }

  const defaultStats = stats || { totalVideos: 0, pendingApproval: 0, publishedCount: 0, recent: [] };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold text-gray-100">Overview</h2>
        <p className="text-gray-400 mt-2">Welcome to your AI Influencer automation dashboard.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Total Videos</h3>
            <p className="text-4xl font-bold text-gray-100 mt-2">{defaultStats.totalVideos}</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
            <Video className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Pending Approval</h3>
            <p className="text-4xl font-bold text-yellow-400 mt-2">{defaultStats.pendingApproval}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium">Published Posts</h3>
            <p className="text-4xl font-bold text-green-400 mt-2">{defaultStats.publishedCount}</p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Generations */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-100 mb-4">Recent Generations</h3>
        
        {defaultStats.recent.length > 0 ? (
          <div className="space-y-4">
            {defaultStats.recent.map(video => (
              <div key={video.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl transition hover:bg-gray-800/80">
                <div className="flex items-center space-x-4">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-200">{video.title}</p>
                    <p className="text-sm text-gray-400">Generated {video.createdAt}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  {video.status === 'GENERATING' && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Génération...
                    </span>
                  )}
                  {video.status === 'PENDING_APPROVAL' && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                      En attente
                    </span>
                  )}
                  {video.status === 'PUBLISHING' && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium animate-pulse">
                      Publication...
                    </span>
                  )}
                  {video.status === 'PUBLISHED' && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                      Publiée
                    </span>
                  )}
                  {video.status === 'FAILED' && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Échec
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-850 rounded-xl border border-gray-800">
            <Video className="w-12 h-12 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-400">Aucune vidéo générée pour le moment.</p>
            <a href="/create" className="text-purple-400 text-sm font-semibold hover:underline mt-2 inline-block">
              Créer votre première vidéo &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
