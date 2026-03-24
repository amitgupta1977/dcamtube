interface FeaturedVideoProps {
  videoUrl: string;
  thumbnailUrl: string;
  incidentType: string;
  city: string;
  country: string;
  road: string;
  views: number;
  commentsCount: number;
  userName: string;
}

export default function FeaturedVideo({
  videoUrl,
  thumbnailUrl,
  incidentType,
  city,
  country,
  road,
  views,
  commentsCount,
  userName
}: FeaturedVideoProps) {
  return (
    <div className="relative h-[70vh] max-h-[600px] bg-black">
      <video
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-cover opacity-60"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end gap-6">
          <img
            src={thumbnailUrl}
            alt={incidentType}
            className="w-64 h-36 object-cover rounded-xl shadow-2xl"
          />
          <div className="flex-1">
            <span className="bg-[#E53935] text-white text-sm px-3 py-1 rounded-full">
              {incidentType}
            </span>
            <h1 className="text-3xl font-bold text-white mt-2 mb-1">{incidentType} - {city}</h1>
            <p className="text-[#aaa] mb-2">{country} - {road}</p>
            <div className="flex items-center gap-4 text-[#aaa] text-sm">
              <span suppressHydrationWarning>{views.toLocaleString()} views</span>
              <span>- </span>
              <span>{commentsCount} comments</span>
              <span>- </span>
              <span>{userName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
