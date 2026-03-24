import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function verifyToken(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const road = searchParams.get('road');
    const incidentType = searchParams.get('incidentType');
    const date = searchParams.get('date');
    const country = searchParams.get('country');

    const where: Record<string, unknown> = { status: 'PUBLISHED' };

    const criteria: string[] = [];
    if (city) {
      where.city = { contains: city };
      criteria.push('city');
    }
    if (road) {
      where.road = { contains: road };
      criteria.push('road');
    }
    if (incidentType) {
      where.incidentType = incidentType;
      criteria.push('incidentType');
    }
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.incidentDate = {
        gte: searchDate,
        lt: nextDay
      };
      criteria.push('date');
    }
    if (country) {
      where.country = country;
      criteria.push('country');
    }

    const shouldFilter = criteria.length >= 2;

    const videos = await prisma.video.findMany({
      where: shouldFilter ? where : where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role !== 'NORMAL') return NextResponse.json({ error: 'Only normal users can upload' }, { status: 403 });

    const body = await request.json();
    const {
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      country,
      city,
      road,
      incidentType,
      incidentDate
    } = body;

    if (!videoUrl || !country || !city || !road || !incidentType || !incidentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        description: description || '',
        videoUrl,
        thumbnailUrl: thumbnailUrl || videoUrl,
        duration: duration || 0,
        country,
        city,
        road,
        incidentType,
        incidentDate: new Date(incidentDate),
        status: 'DRAFT_ADMIN',
        userId: payload.userId
      }
    });

    await prisma.user.update({
      where: { id: payload.userId },
      data: { points: { increment: 100 } }
    }).catch(() => {});

    return NextResponse.json({ ok: true, videoId: video.id });
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
