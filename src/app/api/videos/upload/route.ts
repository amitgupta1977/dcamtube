import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';


export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only NORMAL users can upload
  if (user.role !== 'NORMAL') return NextResponse.json({ error: 'Only normal users can upload videos' }, { status: 403 });
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
      userId: user.id,
      status: 'DRAFT_ADMIN',
    }
  });
  // No points here: they are given when an admin approves the video.
  return NextResponse.json({ ok: true, videoId: video.id });
}
