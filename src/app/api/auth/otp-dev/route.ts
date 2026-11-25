import { NextRequest, NextResponse } from 'next/server';
import { getOTP } from '@/lib/otpStore';

// Local development helper only: shows the pending sign-up code so you can
// test without a real inbox. Never available in production, where it would
// let anyone sign up with someone else's email address.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
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
