import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only list NORMAL users for promotion to GOVERNMENT
  const users = await prisma.user.findMany({ where: { role: 'NORMAL' }, select: { id: true, email: true, firstName: true, lastName: true, role: true } });
  return NextResponse.json({ users });
}
