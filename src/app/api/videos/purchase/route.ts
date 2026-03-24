import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { videoId, userId } = await request.json();

    if (!videoId || !userId) {
      return NextResponse.json({ error: 'Video ID and User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.points < 500) {
      return NextResponse.json({ error: 'Insufficient points. Need 500 points.' }, { status: 400 });
    }

    const existingPurchase = await prisma.videoPurchase.findUnique({
      where: {
        videoId_userId: { videoId, userId }
      }
    });

    if (existingPurchase) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: 500 } }
      }),
      prisma.videoPurchase.create({
        data: { videoId, userId, pointsPaid: 500 }
      })
    ]);

    return NextResponse.json({ success: true, remainingPoints: user.points - 500 });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const userId = searchParams.get('userId');

    if (!videoId || !userId) {
      return NextResponse.json({ purchased: false });
    }

    const purchase = await prisma.videoPurchase.findUnique({
      where: {
        videoId_userId: { videoId, userId }
      }
    });

    return NextResponse.json({ purchased: !!purchase });
  } catch (error) {
    return NextResponse.json({ purchased: false });
  }
}
