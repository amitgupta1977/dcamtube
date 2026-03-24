import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true, message: 'Email already verified' });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null
      }
    });

    return NextResponse.json({ ok: true, message: 'Email verified' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
