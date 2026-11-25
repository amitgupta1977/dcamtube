import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdmin } from '@/lib/auth';

const GOV_COST = 250;
const UPLOADER_SHARE = 100;
const PLATFORM_SHARE = 150;

export async function POST(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const request = await tx.downloadRequest.findUnique({ where: { id: requestId }, include: { video: true } });
      if (!request) return { status: 404, error: 'Request not found' };
      if (request.status !== 'PENDING') return { status: 400, error: 'Request already handled' };

      // Charge the official who asked, not just any government account.
      const gov = await tx.user.findUnique({ where: { id: request.governmentUserId } });
      if (!gov) return { status: 404, error: 'Requesting account not found' };
      if (gov.coins < GOV_COST) return { status: 400, error: 'Insufficient government balance' };

      // Mark it approved first; the status condition stops a double approval.
      const marked = await tx.downloadRequest.updateMany({
        where: { id: requestId, status: 'PENDING' },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });
      if (marked.count !== 1) return { status: 400, error: 'Request already handled' };

      await tx.user.update({ where: { id: gov.id }, data: { coins: { decrement: GOV_COST } } });
      await tx.user.update({ where: { id: request.video.userId }, data: { coins: { increment: UPLOADER_SHARE } } });
      await tx.user.update({ where: { id: admin.id }, data: { coins: { increment: PLATFORM_SHARE } } });
      return { status: 200 };
    });

    if (outcome.status !== 200) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    return NextResponse.json({ ok: true, message: 'Download approved and balances updated' });
  } catch (error) {
    console.error('Approve download error:', error);
    return NextResponse.json({ error: 'Failed to approve download' }, { status: 500 });
  }
}
