import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getLeaderboard() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        points: true,
        _count: {
          select: { videos: true }
        }
      },
      orderBy: { points: 'desc' },
      take: 50
    });
    return users;
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-[#aaa]">Top contributors earning rewards for uploading road incident videos</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-[#272727] text-[#aaa] font-medium text-sm">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-6">User</div>
            <div className="col-span-3 text-center">Videos</div>
            <div className="col-span-2 text-right">Points</div>
          </div>

          <div className="divide-y divide-[#333]">
            {leaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={`grid grid-cols-12 gap-4 p-4 items-center ${
                  index < 3 ? 'bg-[#272727]/50' : ''
                }`}
              >
                <div className="col-span-1 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-[#aaa] font-bold">{index + 1}</span>}
                </div>
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E53935] rounded-full flex items-center justify-center text-white font-bold">
                    {(user.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{user.firstName} {user.lastName}</span>
                </div>
                <div className="col-span-3 text-center text-[#aaa]">
                  {user._count.videos} videos
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-[#FFCA28] font-bold">{user.points}</span>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="p-8 text-center text-[#aaa]">
              No users on the leaderboard yet. Be the first to upload!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
