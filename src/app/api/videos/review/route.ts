import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

function verify(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.substring(7);
  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = verify(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { videoId, action } = await req.json();
  if (!videoId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  if (action === 'approve') {
    await prisma.video.update({ where: { id: videoId }, data: { status: 'PUBLISHED' } });
  } else if (action === 'reject') {
    await prisma.video.update({ where: { id: videoId }, data: { status: 'REJECTED' } });
  } else if (action === 'delete') {
    await prisma.video.delete({ where: { id: videoId } });
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, status: action === 'approve' ? 'PUBLISHED' : action === 'reject' ? 'REJECTED' : 'DELETED' });
}
