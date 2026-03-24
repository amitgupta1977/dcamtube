import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { firstName, lastName, email, password, country, city } = data;

    // No-email signup mode (for local no-code experience)
    const testMode = process.env.TEST_SIGNUP === 'true' || req.headers.get('X-TEST-SIGNUP') === '1';

    if (!email || !password || !firstName || !firstName.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }
    if (testMode) {
      // Create user and skip email verification for quick local testing
      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashed,
          firstName,
          lastName,
          country,
          city,
          role: 'NORMAL',
          emailVerified: true,
          verificationCode: null,
          verificationExpires: null,
          coins: 0,
          points: 0
        }
      });
      return NextResponse.json({ ok: true, message: 'Signup successful (test mode).', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    }

    const hashed = await bcrypt.hash(password, 12);
    // verification code valid for 15 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        firstName,
        lastName,
        country,
        city,
        role: 'NORMAL',
        emailVerified: false,
        verificationCode: code,
        verificationExpires: expires,
        coins: 0,
        points: 0
      }
    });

    // Send verification email (best-effort; don't fail signup if email fails)
    try {
      await sendVerificationEmail(email, code);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    return NextResponse.json({ ok: true, message: 'Signup successful. Verification email sent.' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
