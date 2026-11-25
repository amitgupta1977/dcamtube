import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Values that must never be used as the signing secret in production:
// they are public (in this repo or in .env.example).
const PLACEHOLDER_SECRETS = new Set(['dev-secret', 'change-this-to-a-random-secret']);

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV !== 'production') return secret || 'dev-secret';
  if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error('JWT_SECRET is not set to a private value. Refusing to sign or verify logins.');
  }
  return secret;
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, getSecret(), { expiresIn: '7d' });
}

/** Reads the login token from the Authorization header. Returns the user id, or null. */
export function readUserId(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.substring(7), getSecret()) as { userId?: string };
    return typeof payload.userId === 'string' ? payload.userId : null;
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  role: string;
  points: number;
  coins: number;
};

/**
 * The logged-in user, loaded fresh from the database so a changed role
 * (for example a demoted admin) takes effect immediately. Never trust a
 * userId sent by the browser: use this instead.
 */
export async function getCurrentUser(req: NextRequest): Promise<CurrentUser | null> {
  const userId = readUserId(req);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, points: true, coins: true },
  });
}

export async function getAdmin(req: NextRequest): Promise<CurrentUser | null> {
  const user = await getCurrentUser(req);
  return user && user.role === 'ADMIN' ? user : null;
}

/** Anonymous visitor ids made by the video page: "anon_" plus 6–20 lowercase letters or digits. */
export function isAnonymousId(id: unknown): id is string {
  return typeof id === 'string' && /^anon_[a-z0-9]{6,20}$/.test(id);
}

export const POINTS_PER_APPROVED_VIDEO = 100;

/**
 * Who is liking or commenting: the logged-in user if there is a valid token,
 * otherwise an anonymous visitor id. A real user's id sent by the browser is
 * never accepted, so nobody can act in someone else's name.
 */
export async function resolveActorId(req: NextRequest, claimedId: unknown, anonymousName?: string): Promise<string | null> {
  const loggedIn = readUserId(req);
  if (loggedIn) return loggedIn;
  if (!isAnonymousId(claimedId)) return null;

  const name = (anonymousName || '').trim().slice(0, 40) || 'Anonymous';
  const existing = await prisma.user.findUnique({ where: { id: claimedId }, select: { id: true, passwordHash: true, firstName: true } });
  if (existing) {
    // Only ever touch genuine anonymous records.
    if (existing.passwordHash !== 'anonymous-account') return null;
    if (anonymousName && name !== 'Anonymous' && name !== existing.firstName) {
      await prisma.user.update({ where: { id: claimedId }, data: { firstName: name } });
    }
    return existing.id;
  }
  const created = await prisma.user.create({
    data: {
      id: claimedId,
      firstName: name,
      lastName: '',
      email: `${claimedId}@anonymous.local`,
      passwordHash: 'anonymous-account',
      role: 'NORMAL',
      points: 0,
      coins: 0,
      emailVerified: true,
    },
    select: { id: true },
  });
  return created.id;
}
