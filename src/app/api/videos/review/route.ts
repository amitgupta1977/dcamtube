import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/auth';
import { setVideoStatus } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { videoId, action } = await req.json();
  if (!videoId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  if (action === 'delete') {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    await prisma.video.delete({ where: { id: videoId } });
    return NextResponse.json({ ok: true, status: 'DELETED' });
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const status = action === 'approve' ? 'PUBLISHED' : 'REJECTED';
  const result = await setVideoStatus(videoId, status);
  if (!result) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  return NextResponse.json({ ok: true, status, pointsAwarded: result.pointsAwarded });
}
