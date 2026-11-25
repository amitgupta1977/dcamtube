import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const PRICE = 500;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

    const { videoId } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

    const video = await prisma.video.findUnique({ where: { id: videoId }, select: { status: true } });
    if (!video || video.status !== 'PUBLISHED') return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const already = await tx.videoPurchase.findUnique({ where: { videoId_userId: { videoId, userId: user.id } } });
      if (already) return { error: 'Already purchased' };
      // Only deducts if the balance is still enough at this moment.
      const charged = await tx.user.updateMany({
        where: { id: user.id, points: { gte: PRICE } },
        data: { points: { decrement: PRICE } },
      });
      if (charged.count !== 1) return { error: `Insufficient points. Need ${PRICE} points.` };
      await tx.videoPurchase.create({ data: { videoId, userId: user.id, pointsPaid: PRICE } });
      const updated = await tx.user.findUnique({ where: { id: user.id }, select: { points: true } });
      return { remainingPoints: updated?.points ?? 0 };
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, remainingPoints: result.remainingPoints });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const videoId = new URL(request.url).searchParams.get('videoId');
    if (!user || !videoId) return NextResponse.json({ purchased: false });

    const purchase = await prisma.videoPurchase.findUnique({
      where: { videoId_userId: { videoId, userId: user.id } }
    });
    return NextResponse.json({ purchased: !!purchase });
  } catch {
    return NextResponse.json({ purchased: false });
  }
}
