import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const videos = await prisma.video.findMany({
    where: { status: 'DRAFT_ADMIN' },
    include: { user: { select: { id: true, firstName: true, lastName: true } } }
  });
  return NextResponse.json({ videos });
}
