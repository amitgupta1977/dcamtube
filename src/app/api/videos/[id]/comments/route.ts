import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveActorId } from '@/lib/auth';

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
    const { content, userId, userName } = body;

    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }
    if (text.length > 1000) {
      return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 });
    }

    const video = await prisma.video.findUnique({ where: { id }, select: { status: true } });
    if (!video || video.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const effectiveUserId = await resolveActorId(request, userId, userName);
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: text,
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
