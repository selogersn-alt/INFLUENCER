"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Send, PlayCircle } from 'lucide-react';

type VideoTask = {
  id: string;
  title: string;
  thumbnail: string;
  status: 'PENDING_APPROVAL' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  platforms: string[];
  createdAt: string;
};

export default function PublishQueue() {
  const [tasks, setTasks] = useState<VideoTask[]>([
    {
      id: "v_12345",
      title: "Dancing in Paris - Cinematic",
      thumbnail: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
      status: "PENDING_APPROVAL",
      platforms: ["Instagram", "TikTok", "Facebook"],
      createdAt: "2 hours ago"
    },
    {
      id: "v_67890",
      title: "Travel Vlog Intro",
      thumbnail: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80",
      status: "PUBLISHED",
      platforms: ["Instagram", "TikTok"],
      createdAt: "1 day ago"
    }
  ]);

  const handleApprove = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'PUBLISHING' } : t));
    
    // Simulate publishing delay
    setTimeout(() => {
      setTasks(current => current.map(t => t.id === id ? { ...t, status: 'PUBLISHED' } : t));
    }, 4000);
  };

  const handleReject = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

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
            {/* Thumbnail */}
            <div className="w-full md:w-64 h-36 bg-gray-800 rounded-xl overflow-hidden relative group">
              <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <PlayCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-100">{task.title}</h3>
                <span className="text-sm text-gray-500">{task.createdAt}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Targeting:</span>
                {task.platforms.map(platform => (
                  <span key={platform} className="px-2 py-1 bg-gray-800 rounded-md text-xs font-medium text-gray-300">
                    {platform}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.status === 'PENDING_APPROVAL' && <span className="flex items-center gap-2 text-yellow-400 font-medium text-sm"><Clock className="w-4 h-4" /> Pending Approval</span>}
                  {task.status === 'PUBLISHING' && <span className="flex items-center gap-2 text-blue-400 font-medium text-sm animate-pulse"><Send className="w-4 h-4" /> Publishing...</span>}
                  {task.status === 'PUBLISHED' && <span className="flex items-center gap-2 text-green-400 font-medium text-sm"><CheckCircle className="w-4 h-4" /> Published Successfully</span>}
                </div>

                {task.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleReject(task.id)}
                      className="px-4 py-2 rounded-lg bg-gray-800 text-red-400 hover:bg-red-500/20 font-medium transition"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(task.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/25 flex items-center gap-2"
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
