import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || user.role !== 'GOVERNMENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.status !== 'PUBLISHED') return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const existing = await prisma.downloadRequest.findFirst({
    where: { videoId, governmentUserId: user.id, status: 'PENDING' }
  });
  if (existing) return NextResponse.json({ ok: true, requestId: existing.id });

  const reqObj = await prisma.downloadRequest.create({
    data: { videoId, governmentUserId: user.id, status: 'PENDING' }
  }).catch(() => null);
  if (!reqObj) return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  return NextResponse.json({ ok: true, requestId: reqObj.id });
}
