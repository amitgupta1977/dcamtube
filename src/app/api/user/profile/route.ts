import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Your own profile and videos. Uses the login token, never a userId from the URL,
// so nobody can read another person's email address.
// (The old PATCH that added points to any account has been removed: points are
// only given by the server when an admin approves a video.)
export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUser(request);
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        points: true,
        coins: true,
        createdAt: true,
        videos: {
          select: {
            id: true,
            thumbnailUrl: true,
            incidentType: true,
            city: true,
            country: true,
            views: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
