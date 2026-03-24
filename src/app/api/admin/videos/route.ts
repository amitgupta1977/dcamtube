import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'pending';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};
    
    if (filter === 'pending') {
      where.status = 'DRAFT_ADMIN';
    } else if (filter === 'approved') {
      where.status = 'PUBLISHED';
    } else if (filter === 'rejected') {
      where.status = 'REJECTED';
    }

    if (search) {
      where.OR = [
        { city: { contains: search } },
        { road: { contains: search } },
        { incidentType: { contains: search } },
        { country: { contains: search } },
      ];
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: search ? 50 : undefined
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Get admin videos error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
