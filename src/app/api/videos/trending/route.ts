import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { views: 'desc' },
      take: 20
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Get trending videos error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending videos' }, { status: 500 });
  }
}
