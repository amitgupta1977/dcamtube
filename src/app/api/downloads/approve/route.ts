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
  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  const reqObj = await prisma.downloadRequest.findUnique({ where: { id: requestId }, include: { video: true } });
  if (!reqObj) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  // Perform ledger-like operations
  const gov = await prisma.user.findFirst({ where: { role: 'GOVERNMENT' } });
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const uploader = await prisma.user.findUnique({ where: { id: reqObj.governmentUserId ? undefined : reqObj.video?.userId ?? '' } }).catch(() => null);
  // Simpler: fetch uploader by video's userId
  const uploaderUser = await prisma.user.findUnique({ where: { id: reqObj.video?.userId ?? '' } });
  if (!adminUser || !uploaderUser || !gov) {
    return NextResponse.json({ error: 'Internal data error' }, { status: 500 });
  }
  // Apply transfers: -250 from Gov, +100 to uploader, +150 to Admin
  if ((gov.coins ?? 0) < 250) {
    return NextResponse.json({ error: 'Insufficient government balance' }, { status: 400 });
  }
  await prisma.user.update({ where: { id: gov.id }, data: { coins: { decrement: 250 } } }).catch(() => {});
  await prisma.user.update({ where: { id: uploaderUser.id }, data: { coins: { increment: 100 } } }).catch(() => {});
  await prisma.user.update({ where: { id: adminUser.id }, data: { coins: { increment: 150 } } }).catch(() => {});
  await prisma.downloadRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', approvedAt: new Date() } }).catch(() => {});
  return NextResponse.json({ ok: true, message: 'Download approved and balances updated' });
}
