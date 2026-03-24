import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { OTP_STORE, generateOTP } from '@/lib/otpStore';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    OTP_STORE.set(email, { otp, expires: expiresAt });

    const { previewUrl, via } = await sendVerificationEmail(email, otp);

    return NextResponse.json({
      ok: true,
      message: via === 'resend' ? 'Verification email sent to your inbox!' : 'Verification email sent!',
      previewUrl,
      via,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
