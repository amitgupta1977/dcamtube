'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import VideoCard from '@/components/VideoCard';

interface Video {
  id: string;
  thumbnailUrl: string;
  duration: number;
  country: string;
  city: string;
  road: string;
  incidentType: string;
  views: number;
  commentsCount: number;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setLoading(false);
    }

    fetchVideos();
  }, [searchParams]);

  const criteria: string[] = [];
  if (searchParams.get('city')) criteria.push(`City: ${searchParams.get('city')}`);
  if (searchParams.get('road')) criteria.push(`Road: ${searchParams.get('road')}`);
  if (searchParams.get('incidentType')) criteria.push(`Type: ${searchParams.get('incidentType')}`);
  if (searchParams.get('date')) criteria.push(`Date: ${searchParams.get('date')}`);

  return (
    <div className="min-h-screen bg-[#1E1E1E] pt-20 pb-12">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Search Results</h1>
          <p className="text-[#B0B0B0]">
            {criteria.length > 0 ? `Filtered by: ${criteria.join(' + ')}` : 'Showing all videos'}
          </p>
          <p className="text-[#666] text-sm mt-1">{videos.length} video(s) found</p>
        </div>

        {loading ? (
          <div className="text-white">Loading...</div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-[#404040] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p className="text-[#B0B0B0] text-lg mb-2">No videos found</p>
            <p className="text-[#666]">Try different search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1E1E1E] pt-20 pb-12"><div className="max-w-[1400px] mx-auto px-4 text-white">Loading...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
