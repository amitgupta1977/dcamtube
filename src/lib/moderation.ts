import { prisma } from '@/lib/prisma';
import { POINTS_PER_APPROVED_VIDEO } from '@/lib/auth';

export const VIDEO_STATUSES = ['DRAFT_ADMIN', 'PUBLISHED', 'REJECTED'] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export function isVideoStatus(value: unknown): value is VideoStatus {
  return typeof value === 'string' && (VIDEO_STATUSES as readonly string[]).includes(value);
}

/**
 * Changes a video's status. The uploader gets points only when the video
 * moves into PUBLISHED from another status, so repeating "approve" on an
 * already published video awards nothing.
 * Returns null if the video does not exist, otherwise whether points were awarded.
 */
export async function setVideoStatus(videoId: string, status: VideoStatus): Promise<{ pointsAwarded: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    const video = await tx.video.findUnique({ where: { id: videoId }, select: { id: true, userId: true, status: true } });
    if (!video) return null;

    if (status === 'PUBLISHED') {
      // The status condition makes this safe against two approvals arriving at once.
      const moved = await tx.video.updateMany({
        where: { id: videoId, status: { not: 'PUBLISHED' } },
        data: { status: 'PUBLISHED' },
      });
      if (moved.count === 1) {
        await tx.user.update({ where: { id: video.userId }, data: { points: { increment: POINTS_PER_APPROVED_VIDEO } } });
        return { pointsAwarded: true };
      }
      return { pointsAwarded: false };
    }

    await tx.video.update({ where: { id: videoId }, data: { status } });
    return { pointsAwarded: false };
  });
}
