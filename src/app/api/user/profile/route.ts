import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        points: true,
        coins: true,
        createdAt: true,
        videos: {
          select: {
            id: true,
            thumbnailUrl: true,
            incidentType: true,
            city: true,
            country: true,
            views: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points } = body;

    if (!userId || points === undefined) {
      return NextResponse.json({ error: 'User ID and points required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } }
    });

    return NextResponse.json({ success: true, points: user.points });
  } catch (error) {
    console.error('Update points error:', error);
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
  }
}
