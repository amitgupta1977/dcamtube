import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (approved) {
      await prisma.video.update({
        where: { id },
        data: { approved: true }
      });

      // Award 100 points to user
      await prisma.user.update({
        where: { id: video.userId },
        data: { points: { increment: 100 } }
      });

      return NextResponse.json({ success: true, message: 'Video approved and 100 points awarded' });
    } else {
      await prisma.video.update({
        where: { id },
        data: { rejected: true }
      });

      return NextResponse.json({ success: true, message: 'Video rejected' });
    }
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}
