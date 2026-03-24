export const OTP_STORE = new Map<string, { otp: string; expires: number }>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTP(email: string) {
  return OTP_STORE.get(email);
}

export function deleteOTP(email: string) {
  OTP_STORE.delete(email);
}
