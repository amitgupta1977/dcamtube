import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'GOVERNMENT') return NextResponse.json({ ok: false, error: 'User already Government' }, { status: 400 });
  if (target.role !== 'NORMAL') return NextResponse.json({ ok: false, error: 'Only NORMAL users can be promoted' }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { role: 'GOVERNMENT' } });
  return NextResponse.json({ ok: true, newRole: 'GOVERNMENT' });
}
