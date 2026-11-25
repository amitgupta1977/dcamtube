import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAnonymousId, readUserId } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claimed = new URL(request.url).searchParams.get('userId');
    // Logged-in users are identified by their token; otherwise only anonymous ids are accepted.
    const effectiveUserId = readUserId(request) ?? (isAnonymousId(claimed) ? claimed : null);
    if (!effectiveUserId) {
      return NextResponse.json({ liked: false, disliked: false });
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
