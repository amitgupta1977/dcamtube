import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Sync counts from Like table to ensure accuracy
    const likeCount = await prisma.like.count({
      where: { videoId: id, type: 'like' }
    });
    const dislikeCount = await prisma.like.count({
      where: { videoId: id, type: 'dislike' }
    });
    
    await prisma.video.update({
      where: { id },
      data: { likes: likeCount, dislikes: dislikeCount }
    });
    
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, points: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userId } = body;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (action === 'view') {
      await prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'like' || action === 'dislike') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      // Get or create anonymous user if needed
      let effectiveUserId = userId;
      if (userId.startsWith('anon_')) {
        let anonUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!anonUser) {
          anonUser = await prisma.user.create({
            data: {
              id: userId,
              firstName: 'Anonymous',
              lastName: '',
              email: `${userId}@anonymous.local`,
              passwordHash: 'anonymous-account',
              role: 'NORMAL',
              points: 0,
              coins: 0,
              emailVerified: true
            }
          });
        }
        effectiveUserId = anonUser.id;
      }

      // Check if user already liked/disliked
      const existingLike = await prisma.like.findUnique({
        where: {
          videoId_userId: { videoId: id, userId: effectiveUserId }
        }
      });

      if (existingLike) {
        if (existingLike.type === action) {
          // Remove like/dislike (toggle off)
          await prisma.like.delete({
            where: { id: existingLike.id }
          });
          if (action === 'like') {
            await prisma.video.update({
              where: { id },
              data: { likes: { decrement: 1 } }
            });
          } else {
            await prisma.video.update({
              where: { id },
              data: { dislikes: { decrement: 1 } }
            });
          }
        } else {
          // Switch vote (change like to dislike or vice versa)
          await prisma.like.update({
            where: { id: existingLike.id },
            data: { type: action }
          });
          if (action === 'like') {
            await prisma.video.update({
              where: { id },
              data: { likes: { increment: 1 }, dislikes: { decrement: 1 } }
            });
          } else {
            await prisma.video.update({
              where: { id },
              data: { likes: { decrement: 1 }, dislikes: { increment: 1 } }
            });
          }
        }
      } else {
        // New like/dislike
        await prisma.like.create({
          data: {
            type: action,
            videoId: id,
            userId: effectiveUserId
          }
        });
        if (action === 'like') {
          await prisma.video.update({
            where: { id },
            data: { likes: { increment: 1 } }
          });
        } else {
          await prisma.video.update({
            where: { id },
            data: { dislikes: { increment: 1 } }
          });
        }
      }

      const updatedVideo = await prisma.video.findUnique({ where: { id } });
      return NextResponse.json({ 
        success: true, 
        likes: updatedVideo?.likes || 0, 
        dislikes: updatedVideo?.dislikes || 0 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';

    if (video.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this video' }, { status: 403 });
    }

    await prisma.like.deleteMany({ where: { videoId: id } });
    await prisma.comment.deleteMany({ where: { videoId: id } });
    await prisma.video.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
