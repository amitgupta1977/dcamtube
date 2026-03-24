"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{id:string; email:string; firstName:string; lastName?:string; role:string}>>([]);
  const [promoteStatus, setPromoteStatus] = useState<string | null>(null);
  const [promoteUserId, setPromoteUserId] = useState('');
  const [playingVideo, setPlayingVideo] = useState<any>(null);

  const loadData = () => {
    const token = localStorage.getItem('godashreel_token');
    fetch('/api/videos/pending', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setPendingVideos(data.videos || []);
      });
    fetch('/api/admin/all-videos', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setAllVideos(data.videos || []);
        setLoading(false);
      });
    fetch('/api/users/list', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setUsers((data?.users) || []);
      });
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadData();
  }, [user]);

  if (!user) {
    return <div className="min-h-screen bg-[#0f0f0f] pt-24 text-white text-center">Please login first.</div>;
  }
  if (!user.isAdmin) {
    return <div className="min-h-screen bg-[#0f0f0f] pt-24 text-white text-center">Access denied. Admin only.</div>;
  }

  const review = async (videoId: string, action: 'approve'|'reject') => {
    const token = localStorage.getItem('godashreel_token');
    const res = await fetch('/api/videos/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ videoId, action })
    });
    const data = await res.json();
    if (data?.ok) {
      setPendingVideos(pendingVideos.filter(v => v.id !== videoId));
      setAllVideos(allVideos.filter(v => v.id !== videoId));
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video permanently?')) return;
    const token = localStorage.getItem('godashreel_token');
    const res = await fetch('/api/videos/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ videoId, action: 'delete' })
    });
    const data = await res.json();
    if (data?.ok) {
      setAllVideos(allVideos.filter(v => v.id !== videoId));
      setPendingVideos(pendingVideos.filter(v => v.id !== videoId));
    }
  };

  const promote = async () => {
    if (!promoteUserId) return;
    const token = localStorage.getItem('godashreel_token');
    setPromoteStatus(null);
    const res = await fetch('/api/users/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: promoteUserId })
    });
    const data = await res.json();
    if (data?.ok) {
      setPromoteStatus(`User promoted to Government successfully`);
      setPromoteUserId('');
      const t = localStorage.getItem('godashreel_token');
      fetch('/api/users/list', { headers: { 'Authorization': `Bearer ${t}` } })
        .then(r => r.json())
        .then(d => setUsers(d.users || []));
    } else {
      setPromoteStatus(`Error: ${data?.error || 'Unknown'}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] pt-24 text-white">Loading...</div>;

  const statusBadge = (s: string) => {
    if (s === 'PUBLISHED') return <span className="bg-green-600/20 text-green-400 text-xs px-2 py-0.5 rounded">Published</span>;
    if (s === 'REJECTED') return <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded">Rejected</span>;
    return <span className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-0.5 rounded">Pending</span>;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>

        <div className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-yellow-500 rounded-full"></span>
            Pending Reviews ({pendingVideos.length})
          </h2>
          {pendingVideos.length === 0 && <p className="text-[#aaa]">No videos pending review</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingVideos.map(v => (
              <div key={v.id} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                <div className="relative cursor-pointer group" onClick={() => setPlayingVideo(v)}>
                  <img src={v.thumbnailUrl} alt="thumb" className="w-full h-40 object-cover rounded" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <div className="w-12 h-12 bg-[#E53935] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-[#ddd]">{v.incidentType} - {v.city}, {v.country}</div>
                <div className="text-xs text-[#888]">{v.user?.firstName} {v.user?.lastName}</div>
                <div className="mt-2 flex gap-2">
                  <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm" onClick={() => review(v.id,'approve')}>Approve</button>
                  <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm" onClick={() => review(v.id,'reject')}>Reject</button>
                  <button className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white text-sm" onClick={() => deleteVideo(v.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#E53935] rounded-full"></span>
            All Videos ({allVideos.length})
          </h2>
          {allVideos.length === 0 && <p className="text-[#aaa]">No videos yet</p>}
          <div className="space-y-2">
            {allVideos.map(v => (
              <div key={v.id} className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333] flex items-center gap-4">
                <div className="relative cursor-pointer shrink-0 group" onClick={() => setPlayingVideo(v)}>
                  <img src={v.thumbnailUrl} alt="thumb" className="w-24 h-14 object-cover rounded" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#ddd] font-medium">{v.incidentType} - {v.city}, {v.country}</div>
                  <div className="text-xs text-[#888]">{v.user?.firstName} {v.user?.lastName} • {statusBadge(v.status)}</div>
                </div>
                <button
                  className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-white text-sm shrink-0"
                  onClick={() => deleteVideo(v.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-[#1a1a1a] rounded-xl border border-[#333]">
          <h2 className="text-xl font-semibold text-white mb-4">Promote User to Government</h2>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <select
              value={promoteUserId}
              onChange={e => setPromoteUserId(e.target.value)}
              className="bg-[#272727] text-white px-3 py-2 rounded-lg border border-[#444] w-full md:w-80"
            >
              <option value="">Select a user</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email} ({u.firstName})</option>
              ))}
            </select>
            <button
              onClick={promote}
              className="bg-[#E53935] hover:bg-[#C62828] text-white px-6 py-2 rounded-lg font-medium"
            >
              Promote
            </button>
          </div>
          {promoteStatus && <div className="mt-3 text-sm text-green-400">{promoteStatus}</div>}
        </div>
      </div>

      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div className="text-white text-sm">{playingVideo.incidentType} - {playingVideo.city}, {playingVideo.country}</div>
              <button onClick={() => setPlayingVideo(null)} className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <video
              src={playingVideo.videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg aspect-video bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
