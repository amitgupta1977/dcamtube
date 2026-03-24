import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    await prisma.video.update({
      where: { id },
      data: { status }
    });

    if (status === 'PUBLISHED') {
      await prisma.user.update({
        where: { id: video.userId },
        data: { points: { increment: 100 } }
      });
      return NextResponse.json({ success: true, message: 'Video published and 100 points awarded' });
    }

    return NextResponse.json({ success: true, message: `Video ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}
