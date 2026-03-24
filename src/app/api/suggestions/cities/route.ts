import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    
    if (q.length < 2) {
      return NextResponse.json({ cities: [] });
    }

    const cities = await prisma.city.findMany({
      where: {
        name: { contains: q }
      },
      select: { name: true },
      take: 10,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ cities: cities.map(c => c.name) });
  } catch (error) {
    console.error('Get cities error:', error);
    return NextResponse.json({ cities: [] });
  }
}
