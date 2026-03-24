import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { OTP_STORE } from '@/lib/otpStore';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password, firstName, lastName, country, city } = await req.json();

    if (!email || !otp || !password || !firstName) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const stored = OTP_STORE.get(email);
    if (!stored) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (Date.now() > stored.expires) {
      OTP_STORE.delete(email);
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (stored.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

    OTP_STORE.delete(email);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        firstName,
        lastName: lastName || '',
        country: country || '',
        city: city || '',
        role: 'NORMAL',
        emailVerified: true,
        points: 0,
        coins: 0,
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        coins: user.coins,
      }
    });
  } catch (error) {
    console.error('Verify signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
