import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/auth';
import { isVideoStatus, setVideoStatus } from '@/lib/moderation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await getAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { status } = await request.json();
    if (!isVideoStatus(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await setVideoStatus(id, status);
    if (!result) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    if (result.pointsAwarded) {
      return NextResponse.json({ success: true, message: 'Video published and 100 points awarded' });
    }
    return NextResponse.json({ success: true, message: `Video ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}
