import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { videoId: id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    let { content, userId, userName } = body;

    if (!content || !userId) {
      return NextResponse.json({ error: 'Content and user ID required' }, { status: 400 });
    }

    // Get or create anonymous user if needed
    let effectiveUserId = userId;
    if (userId.startsWith('anon_')) {
      let anonUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!anonUser) {
          anonUser = await prisma.user.create({
            data: {
              id: userId,
              firstName: userName || 'Anonymous',
              lastName: '',
              email: `${userId}@anonymous.local`,
              role: 'NORMAL',
              points: 0,
              coins: 0,
              emailVerified: true
            }
          });
        } else if (userName && userName !== 'Anonymous') {
          await prisma.user.update({
            where: { id: userId },
            data: { firstName: userName }
          });
      }
      effectiveUserId = anonUser.id;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        videoId: id,
        userId: effectiveUserId
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    await prisma.video.update({
      where: { id },
      data: { commentsCount: { increment: 1 } }
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
