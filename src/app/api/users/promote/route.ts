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
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'GOVERNMENT') return NextResponse.json({ ok: false, error: 'User already Government' }, { status: 400 });
  if (target.role !== 'NORMAL') return NextResponse.json({ ok: false, error: 'Only NORMAL users can be promoted' }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { role: 'GOVERNMENT' } });
  return NextResponse.json({ ok: true, newRole: 'GOVERNMENT' });
}
