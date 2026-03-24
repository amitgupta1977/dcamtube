import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = auth.substring(7);
    const payload: any = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { videos: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const safe = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, coins: user.coins, points: user.points };
    return NextResponse.json({ user: safe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
