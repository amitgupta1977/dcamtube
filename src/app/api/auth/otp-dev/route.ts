import { NextRequest, NextResponse } from 'next/server';
import { getOTP } from '@/lib/otpStore';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  const stored = getOTP(email);
  if (!stored || Date.now() > stored.expires) {
    return NextResponse.json({ error: 'No valid OTP found' }, { status: 404 });
  }
  return NextResponse.json({ otp: stored.otp });
}
