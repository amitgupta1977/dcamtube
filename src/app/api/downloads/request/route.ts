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
  if (!user || user.role !== 'GOVERNMENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  // create a download request (pending admin approval in this MVP)
  const reqObj = await prisma.$transaction(async (tx) => {
    // simple create in the database
    const r = await tx.downloadRequest.create({
      data: {
        videoId,
        governmentUserId: user.userId,
        status: 'PENDING'
      }
    });
    return r;
  }).catch(() => null);
  if (!reqObj) return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  return NextResponse.json({ ok: true, requestId: reqObj.id });
}
