import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only NORMAL users can upload
  if (payload.role !== 'NORMAL') return NextResponse.json({ error: 'Only normal users can upload videos' }, { status: 403 });
  const { videoUrl, thumbnailUrl, duration, country, city, road, incidentType, incidentDate } = await req.json();
  if (!videoUrl || !thumbnailUrl || !duration) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const video = await prisma.video.create({
    data: {
      videoUrl,
      thumbnailUrl,
      duration,
      country,
      city,
      road,
      incidentType,
      incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
      userId: payload.userId,
      status: 'DRAFT_ADMIN',
    }
  });
  // reward points for upload
  await prisma.user.update({ where: { id: payload.userId }, data: { points: { increment: 100 } } }).catch(() => {});
  return NextResponse.json({ ok: true, videoId: video.id });
}
