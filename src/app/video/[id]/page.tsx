'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Video {
  id: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  country: string;
  city: string;
  road: string;
  incidentType: string;
  incidentDate: string;
  views: number;
  likes: number;
  dislikes: number;
  commentsCount: number;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; points?: number };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

export default function VideoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentName, setCommentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const isAdmin = user?.isAdmin || false;

  // Get or create anonymous user ID
  const getAnonymousId = () => {
    let anonId = localStorage.getItem('godashreel_anon_id');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('godashreel_anon_id', anonId);
    }
    return anonId;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Increment view count
        const userId = user?.id || getAnonymousId();
        await fetch(`/api/videos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view', userId })
        });

        const res = await fetch(`/api/videos/${id}`);
        const data = await res.json();
        
        if (data.video) {
          setVideo(data.video);
          setComments(data.video.comments || []);
          
          // Check if user already liked/disliked
          try {
            const likeRes = await fetch(`/api/videos/${id}/like-status?userId=${userId}`);
            const likeData = await likeRes.json();
            if (likeData.liked) setLiked(true);
            if (likeData.disliked) setDisliked(true);
          } catch {}

          // Fetch related videos
          const relatedRes = await fetch(`/api/videos?incidentType=${data.video.incidentType}`);
          const relatedData = await relatedRes.json();
          setRelatedVideos((relatedData.videos || []).filter((v: Video) => v.id !== id).slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching video:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id, user]);

  const handleLike = async () => {
    if (!video) return;
    
    const wasLiked = liked;
    
    try {
      const userId = user?.id || getAnonymousId();
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', userId })
      });
      const data = await res.json();
      
      if (data.success) {
        setVideo({ ...video, likes: data.likes, dislikes: data.dislikes });
        setLiked(!wasLiked);
        setDisliked(false);
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleDislike = async () => {
    if (!video) return;
    
    const wasDisliked = disliked;
    
    try {
      const userId = user?.id || getAnonymousId();
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dislike', userId })
      });
      const data = await res.json();
      
      if (data.success) {
        setVideo({ ...video, likes: data.likes, dislikes: data.dislikes });
        setDisliked(!wasDisliked);
        setLiked(false);
      }
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !video) return;

    const isAnonymous = !user;
    const name = isAnonymous ? (commentName.trim() || 'Anonymous') : `${user.firstName} ${user.lastName}`.trim();
    const userId = user?.id || getAnonymousId();

    setSubmitting(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: comment, 
          userId,
          userName: name,
          isAnonymous
        })
      });
      const data = await res.json();

      if (data.success) {
        setComments([data.comment, ...comments]);
        setComment('');
        setCommentName('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
    setSubmitting(false);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = video ? `${video.incidentType} - ${video.city}, ${video.country}` : 'Check out this video';
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(title + '\n' + url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied!');
        break;
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-4 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-4 flex items-center justify-center">
        <div className="text-[#aaa]">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-4 pb-8">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main Video Section */}
          <div className="flex-1 xl:max-w-[1280px]">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video
                src={video.videoUrl}
                controls
                poster={video.thumbnailUrl}
                className="w-full h-full"
                controlsList={isAdmin ? "download" : "nodownload"}
              />
              
              {!isAdmin && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 select-none text-xs font-bold tracking-widest" style={{ transform: 'translate(-60px, -40px) rotate(-15deg)' }}>
                    DCamTube
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 select-none text-xs font-bold tracking-widest" style={{ transform: 'rotate(-15deg)' }}>
                    DCamTube
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 select-none text-xs font-bold tracking-widest" style={{ transform: 'translate(50px, 30px) rotate(-15deg)' }}>
                    DCamTube
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="flex items-center justify-between mt-3 pb-3 border-b border-[#333]">
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <a
                      href={video.videoUrl}
                      download
                      className="flex items-center gap-2 px-3 py-2 bg-[#272727] hover:bg-[#3a3a3a] text-white rounded-lg text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      Download
                    </a>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 px-3 py-2 bg-[#272727] hover:bg-[#25D366] text-white rounded-lg text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Share
                    </button>
                  </>
                )}
                

              </div>
            </div>

            <h1 className="text-xl font-bold text-white mt-4 mb-2">{video.incidentType} - {video.city}, {video.country}</h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-[#333]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#E53935] rounded-full flex items-center justify-center text-white font-bold">
                  {(video.user.firstName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{video.user.firstName} {video.user.lastName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors ${
                    liked ? 'bg-[#E53935] text-white' : 'bg-[#272727] hover:bg-[#3a3a3a] text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                  <span className="font-medium">{video.likes}</span>
                </button>
                <button
                  onClick={handleDislike}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors ${
                    disliked ? 'bg-[#E53935] text-white' : 'bg-[#272727] hover:bg-[#3a3a3a] text-white'
                  }`}
                >
                  <svg className="w-5 h-5 rotate-180" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                  <span className="font-medium">{video.dislikes}</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#272727] hover:bg-[#3a3a3a] text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                  <span className="font-medium">Share</span>
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white font-medium">{formatViews(video.views)} views</span>
                <span className="text-[#aaa]">•</span>
                  <span className="text-[#aaa]" suppressHydrationWarning>{formatDate(video.createdAt)}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-[#E53935]/20 text-[#E53935] px-3 py-1 rounded-full text-sm font-medium">
                  {video.incidentType}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-3 border-t border-[#333]">
                <div>
                  <span className="text-[#aaa]">Date</span>
                  <p className="text-white font-medium">{formatDate(video.incidentDate)}</p>
                </div>
                <div>
                  <span className="text-[#aaa]">City</span>
                  <p className="text-white font-medium">{video.city}</p>
                </div>
                <div>
                  <span className="text-[#aaa]">Road</span>
                  <p className="text-white font-medium">{video.road}</p>
                </div>
                <div>
                  <span className="text-[#aaa]">Country</span>
                  <p className="text-white font-medium">{video.country}</p>
                </div>
              </div>

              {video.description && (
                <div className="mt-4 pt-4 border-t border-[#333]">
                  <p className="text-white">{video.description}</p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <h3 className="text-white font-semibold text-lg mb-4">{comments.length} Comments</h3>
              
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    ?
                  </div>
                  <div className="flex-1">
                    {!user && (
                      <input
                        type="text"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="w-full bg-[#1a1a1a] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] border border-[#333] mb-2"
                      />
                    )}
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] resize-none border border-[#333]"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="submit"
                        disabled={submitting || !comment.trim()}
                        className="bg-[#E53935] hover:bg-[#C62828] disabled:bg-[#666] text-white px-4 py-2 rounded-full text-sm font-medium"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center text-white shrink-0">
                      {(c.user.firstName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{c.user.firstName} {c.user.lastName}</span>
                        <span className="text-[#666] text-xs">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-[#ccc] text-sm mt-1">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Videos - YouTube Style Right Sidebar */}
          <div className="w-full xl:w-[400px] shrink-0">
            <h3 className="text-white font-semibold mb-3">Up Next</h3>
            <div className="space-y-2">
              {relatedVideos.map((v) => (
                <a
                  key={v.id}
                  href={`/video/${v.id}`}
                  className="flex gap-2 p-2 rounded-lg hover:bg-[#272727] transition-colors"
                >
                  <div className="relative w-40 h-24 shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a]">
                    <img
                      src={v.thumbnailUrl}
                      alt={v.incidentType}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium line-clamp-2">{v.incidentType}</h4>
                    <p className="text-[#aaa] text-xs mt-1">{v.city}, {v.country}</p>
                    <div className="flex items-center gap-2 text-[#666] text-xs mt-1">
                      <span>{formatViews(v.views)} views</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
