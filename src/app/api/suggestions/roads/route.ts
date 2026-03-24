import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    
    if (q.length < 2) {
      return NextResponse.json({ roads: [] });
    }

    const where: Record<string, unknown> = {
      name: { contains: q }
    };

    if (city) {
      where.city = city;
    }

    const roads = await prisma.road.findMany({
      where,
      select: { name: true },
      take: 10,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ roads: roads.map(r => r.name) });
  } catch (error) {
    console.error('Get roads error:', error);
    return NextResponse.json({ roads: [] });
  }
}
