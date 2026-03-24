'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views: number) {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

export default function HomePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        setVideos(data.videos || []);
        setLoading(false);
      });
  }, []);

  const trending = [...videos].sort((a, b) => (b.views + b.commentsCount) - (a.views + a.commentsCount)).slice(0, 4);
  const recent = [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const liked = [...videos].sort((a, b) => b.likes - a.likes).slice(0, 4);
  const featured = trending[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-20 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20">
      {!featured ? (
        <div className="relative h-[50vh] max-h-[400px] bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#E53935] rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#FFCA28] rounded-full blur-[80px]"></div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <img src="/logo-center.svg" alt="DCamTube" className="center-logo" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              DCam<span className="text-[#E53935]">Tube</span>
            </h1>
            <p className="text-[#aaa] text-lg max-w-xl mb-6">
              Share and discover road incident videos captured by dashcams. Report traffic incidents and earn rewards.
            </p>
            <div className="flex gap-4">
              <a href="/upload" className="bg-[#E53935] hover:bg-[#C62828] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Upload Video
              </a>
              <a href="/search" className="bg-[#1a1a1a] hover:bg-[#272727] text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-[#333]">
                Browse Videos
              </a>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
        </div>
      ) : (
        <div className="relative h-[70vh] max-h-[600px] bg-black">
          <video
            src={featured.videoUrl}
            poster={featured.thumbnailUrl}
            className="w-full h-full object-cover opacity-60"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-[1400px] mx-auto">
            <div className="flex items-end gap-6">
              <Link href={`/video/${featured.id}`}>
                <img src={featured.thumbnailUrl} alt={featured.incidentType} className="w-64 h-36 object-cover rounded-xl shadow-2xl cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              <div className="flex-1">
                <span className="bg-[#E53935] text-white text-sm px-3 py-1 rounded-full">{featured.incidentType}</span>
                <h1 className="text-3xl font-bold text-white mt-2 mb-1">{featured.incidentType} - {featured.city}</h1>
                <p className="text-[#aaa] mb-2">{featured.country} - {featured.road}</p>
                <div className="flex items-center gap-4 text-[#aaa] text-sm">
                  <span>{formatViews(featured.views)} views</span>
                  <span>- </span>
                  <span>{featured.commentsCount} comments</span>
                  <span>- </span>
                  <span>{featured.user?.firstName} {featured.user?.lastName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-[#E53935] rounded-full"></div>
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
            <span className="text-[#666] text-sm ml-2">(Most Viewed + Comments)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {trending.map(v => (
              <Link key={v.id} href={`/video/${v.id}`} className="group">
                <div className="bg-transparent rounded-xl overflow-hidden hover:bg-[#272727] transition-colors">
                  <div className="relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden">
                    <img src={v.thumbnailUrl} alt={v.incidentType} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">{formatDuration(v.duration)}</div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 bg-[#E53935] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#E53935]/20 text-[#E53935] text-xs px-2 py-0.5 rounded">{v.incidentType}</span>
                    </div>
                    <p className="text-white text-sm font-medium mb-1">{v.city}, {v.country}</p>
                    <p className="text-[#888] text-xs mb-1">{v.road}</p>
                    <div className="flex items-center justify-between text-[#666] text-xs">
                      <span>{v.user?.firstName} {v.user?.lastName}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatViews(v.views)} views</span>
                        <span>•</span>
                        <span>{formatDate(v.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-[#FFCA28] rounded-full"></div>
            <h2 className="text-xl font-bold text-white">Recent Uploads</h2>
          </div>
          {recent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recent.map(v => (
                <Link key={v.id} href={`/video/${v.id}`} className="group">
                  <div className="bg-transparent rounded-xl overflow-hidden hover:bg-[#272727] transition-colors">
                    <div className="relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden">
                      <img src={v.thumbnailUrl} alt={v.incidentType} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">{formatDuration(v.duration)}</div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#E53935] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#E53935]/20 text-[#E53935] text-xs px-2 py-0.5 rounded">{v.incidentType}</span>
                      </div>
                      <p className="text-white text-sm font-medium mb-1">{v.city}, {v.country}</p>
                      <p className="text-[#888] text-xs mb-1">{v.road}</p>
                      <div className="flex items-center justify-between text-[#666] text-xs">
                        <span>{v.user?.firstName} {v.user?.lastName}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatViews(v.views)} views</span>
                          <span>•</span>
                          <span>{formatDate(v.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#1a1a1a] rounded-xl">
              <p className="text-[#aaa]">No recent uploads</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-[#4CAF50] rounded-full"></div>
            <h2 className="text-xl font-bold text-white">Most Liked</h2>
          </div>
          {liked.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {liked.map(v => (
                <Link key={v.id} href={`/video/${v.id}`} className="group">
                  <div className="bg-transparent rounded-xl overflow-hidden hover:bg-[#272727] transition-colors">
                    <div className="relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden">
                      <img src={v.thumbnailUrl} alt={v.incidentType} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">{formatDuration(v.duration)}</div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#E53935] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#E53935]/20 text-[#E53935] text-xs px-2 py-0.5 rounded">{v.incidentType}</span>
                      </div>
                      <p className="text-white text-sm font-medium mb-1">{v.city}, {v.country}</p>
                      <p className="text-[#888] text-xs mb-1">{v.road}</p>
                      <div className="flex items-center justify-between text-[#666] text-xs">
                        <span>{v.user?.firstName} {v.user?.lastName}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatViews(v.views)} views</span>
                          <span>•</span>
                          <span>{formatDate(v.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#1a1a1a] rounded-xl">
              <p className="text-[#aaa]">No liked videos yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
