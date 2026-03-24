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

export async function GET(req: NextRequest) {
  const user = verify(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Only list NORMAL users for promotion to GOVERNMENT
  const users = await prisma.user.findMany({ where: { role: 'NORMAL' }, select: { id: true, email: true, firstName: true, lastName: true, role: true } });
  return NextResponse.json({ users });
}
