import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const OTPS_STORE = new Map<string, { otp: string; expires: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, otp, name, isAdmin } = body;

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    // Validate OTP from storage
    const identifier = email || phone;
    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    }

    const storedOTP = OTPS_STORE.get(identifier);
    
    if (!storedOTP) {
      return NextResponse.json({ error: 'OTP not found. Please request a new OTP.' }, { status: 400 });
    }

    if (Date.now() > storedOTP.expires) {
      OTPS_STORE.delete(identifier);
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
    }

    if (storedOTP.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, delete it and proceed
    OTPS_STORE.delete(identifier);

    // Find or create user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const isDemoAdmin = email.includes('admin') || email === 'admin@godashreel.com';
        user = await prisma.user.create({
          data: { 
            email, 
            name: name || email.split('@')[0],
            isAdmin: isAdmin || isDemoAdmin
          }
        });
      }
    } else if (phone) {
      user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        user = await prisma.user.create({
          data: { phone, name: name || 'User' }
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (isAdmin && !user.isAdmin) {
      return NextResponse.json({ error: 'You are not an admin' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.firstName + ' ' + user.lastName,
        points: user.points,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
