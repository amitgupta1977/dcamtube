import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this video' }, { status: 403 });
    }

    await prisma.video.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
