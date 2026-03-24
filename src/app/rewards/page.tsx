'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Video {
  id: string;
  thumbnailUrl: string;
  incidentType: string;
  city: string;
  country: string;
  views: number;
  createdAt: string;
}

export default function RewardsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    async function fetchVideos() {
      if (!user) return;
      const res = await fetch(`/api/user/profile?userId=${user.id}`);
      const data = await res.json();
      setVideos(data.user?.videos || []);
      setLoading(false);
    }

    if (user) fetchVideos();
  }, [user, router]);

  const handleDelete = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this video?')) return;
    if (!user) return;

    try {
      const res = await fetch(`/api/videos/${videoId}?userId=${user.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        setVideos(videos.filter(v => v.id !== videoId));
      } else {
        alert(data.error || 'Failed to delete video');
      }
    } catch {
      alert('Failed to delete video');
    }
  };

  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#FFCA28] to-[#FFA000] rounded-2xl p-8 mb-8 text-center">
          <h1 className="text-white text-sm font-medium mb-2">Your Total Points</h1>
          <div className="text-6xl font-bold text-white mb-2">{user.points}</div>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            <span className="font-medium">Points</span>
          </div>
          {(user as any).coins !== undefined && (
            <div className="mt-2 text-white/70 text-sm">
              {(user as any).coins} Coins
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-8 border border-[#333]">
          <h2 className="text-xl font-bold text-white mb-4">How to Earn Points</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#aaa]">Upload a video (when approved)</span>
              <span className="text-[#FFCA28] font-bold">+100 points</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Uploaded Videos</h2>
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map(video => (
                <Link
                  key={video.id}
                  href={`/video/${video.id}`}
                  className="flex items-center gap-4 bg-[#1a1a1a] hover:bg-[#272727] rounded-xl p-3 transition-colors border border-[#333] group"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.incidentType}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{video.incidentType}</h3>
                    <p className="text-[#aaa] text-sm">{video.city}, {video.country} • {video.views} views</p>
                    <p className="text-[#666] text-sm">{formatDate(video.createdAt)}</p>
                  </div>
                  <div className="text-[#FFCA28] font-bold">+100</div>
                  <button
                    onClick={(e) => handleDelete(video.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[#F44336] hover:bg-[#F44336]/20 rounded-lg transition-all"
                    title="Delete video"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <p className="text-[#aaa]">You haven't uploaded any videos yet</p>
              <Link href="/upload" className="text-[#E53935] hover:underline mt-2 inline-block">
                Upload your first video
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
