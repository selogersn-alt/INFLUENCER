"use client";

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Send, PlayCircle, Loader2 } from 'lucide-react';

type VideoTask = {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string | null;
  status: 'PENDING_APPROVAL' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  platforms: string[];
  createdAt: string;
};

export default function PublishQueue() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/publish/queue');
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: string) => {
    // 1. Instantly set local status to 'PUBLISHING' to give immediate user feedback
    setTasks(current => current.map(t => t.id === id ? { ...t, status: 'PUBLISHING' } : t));
    
    try {
      // 2. Call backend approval API
      const res = await fetch(`/api/publish/approve/${id}`, {
        method: "POST"
      });
      
      const data = await res.json();
      if (!data.success) {
        alert("Erreur lors de l'approbation : " + (data.error || ""));
        fetchQueue(); // Reload correct state
        return;
      }

      // 3. Simulate completion matching the backend timeout (4 seconds)
      setTimeout(() => {
        setTasks(current => current.map(t => t.id === id ? { ...t, status: 'PUBLISHED' } : t));
      }, 4000);

    } catch (err) {
      console.error('Approval request failed:', err);
      alert("Erreur réseau lors de la validation.");
      fetchQueue();
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Voulez-vous vraiment rejeter et supprimer cette vidéo de la file d'attente ?")) return;

    try {
      const res = await fetch(`/api/publish/reject/${id}`, {
        method: "POST"
      });

      const data = await res.json();
      if (data.success) {
        // Remove task from state
        setTasks(current => current.filter(t => t.id !== id));
      } else {
        alert("Impossible de rejeter : " + (data.error || ""));
      }
    } catch (err) {
      console.error('Rejection request failed:', err);
      alert("Erreur réseau lors de la suppression.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Chargement de la file de publication...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Send className="w-8 h-8 text-blue-400" />
          Publishing Queue
        </h2>
        <p className="text-gray-400 mt-2">Review generated videos and approve them for social media publication.</p>
      </header>

      <div className="space-y-6">
        {tasks.map(task => (
          <div key={task.id} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 transition-all hover:border-gray-700">
            
            {/* Thumbnail / Video Player */}
            <div className="w-full md:w-64 h-36 bg-gray-800 rounded-xl overflow-hidden relative group flex items-center justify-center">
              {task.videoUrl ? (
                <video src={task.videoUrl} className="w-full h-full object-cover" controls />
              ) : (
                <>
                  <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xl font-bold text-gray-100">{task.title}</h3>
                <span className="text-sm text-gray-500">{task.createdAt}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Targeting:</span>
                {task.platforms.map(platform => (
                  <span key={platform} className="px-2.5 py-1 bg-gray-850 rounded-md text-xs font-semibold text-gray-300 border border-gray-800">
                    {platform}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  {task.status === 'PENDING_APPROVAL' && (
                    <span className="flex items-center gap-2 text-yellow-400 font-medium text-sm">
                      <Clock className="w-4 h-4" /> Pending Approval
                    </span>
                  )}
                  {task.status === 'PUBLISHING' && (
                    <span className="flex items-center gap-2 text-blue-400 font-medium text-sm animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                    </span>
                  )}
                  {task.status === 'PUBLISHED' && (
                    <span className="flex items-center gap-2 text-green-400 font-medium text-sm">
                      <CheckCircle className="w-4 h-4" /> Published Successfully
                    </span>
                  )}
                  {task.status === 'FAILED' && (
                    <span className="flex items-center gap-2 text-red-400 font-medium text-sm">
                      <XCircle className="w-4 h-4" /> Publishing Failed
                    </span>
                  )}
                </div>

                {task.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleReject(task.id)}
                      className="px-4 py-2 rounded-lg bg-gray-850 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 border border-gray-800 font-medium transition text-sm"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(task.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/25 flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Publish
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <CheckCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-300">All caught up!</h3>
            <p className="text-gray-500 mt-2">No videos pending approval right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
