import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ liked: false, disliked: false });
    }

    let effectiveUserId = userId;
    if (userId.startsWith('anon_')) {
      const anonUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!anonUser) {
        return NextResponse.json({ liked: false, disliked: false });
      }
      effectiveUserId = anonUser.id;
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        videoId_userId: { videoId: id, userId: effectiveUserId }
      }
    });

    return NextResponse.json({ 
      liked: existingLike?.type === 'like',
      disliked: existingLike?.type === 'dislike'
    });
  } catch (error) {
    console.error('Get like status error:', error);
    return NextResponse.json({ liked: false, disliked: false });
  }
}
