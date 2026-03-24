import Link from 'next/link';

interface VideoCardProps {
  video: {
    id: string;
    thumbnailUrl: string;
    duration: number;
    country: string;
    city: string;
    road: string;
    incidentType: string;
    views: number;
    commentsCount: number;
    dateLabel?: string;
    createdAt?: string;
    user: { id: string; firstName: string; lastName: string };
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const dateLabel = video.dateLabel || (video.createdAt
    ? new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <Link href={`/video/${video.id}`} className="group">
      <div className="bg-transparent rounded-xl overflow-hidden hover:bg-[#272727] transition-colors">
        <div className="relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt={video.incidentType}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 bg-[#E53935] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="p-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#E53935]/20 text-[#E53935] text-xs px-2 py-0.5 rounded">
              {video.incidentType}
            </span>
          </div>
          <p className="text-white text-sm font-medium mb-1">{video.city}, {video.country}</p>
          <p className="text-[#888] text-xs mb-1">{video.road}</p>
          <div className="flex items-center justify-between text-[#666] text-xs">
            <span>{video.user.firstName} {video.user.lastName}</span>
            <div className="flex items-center gap-2">
              <span>{formatViews(video.views)} views</span>
              <span suppressHydrationWarning>{video.dateLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
