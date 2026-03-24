import { Resend } from 'resend';
import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedInboxUrl: string | null = null;
let initPromise: Promise<{ transporter: nodemailer.Transporter; inboxUrl: string }> | null = null;

async function getEtherealTransporter() {
  if (cachedTransporter && cachedInboxUrl) {
    return { transporter: cachedTransporter, inboxUrl: cachedInboxUrl };
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedTransporter = transporter;
    cachedInboxUrl = `https://ethereal.email/messages/${testAccount.user}`;
    return { transporter, inboxUrl: cachedInboxUrl };
  })();

  return initPromise;
}

function getEmailHtml(code: string) {
  const logoSvg = `<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="40" rx="6" fill="#1e3a8a"/><text x="10" y="26" fill="#fff" font-family="Arial" font-size="16" font-weight="bold">DCam</text><text x="68" y="26" fill="#ff0000" font-family="Arial" font-size="16" font-weight="bold">Tube</text></svg>`;
  return `
  <div style="font-family: Arial, sans-serif; color:#111; text-align:center; max-width:500px; margin:0 auto;">
    ${logoSvg}
    <h2 style="color:#1e40af; margin: 16px 0 8px; font-size:28px;">DCamTube Email Verification</h2>
    <p>Hi there,</p>
    <p>Welcome to DCamTube! Please verify your email address using the code below:</p>
    <div style="display:inline-block; padding:16px 28px; border:2px solid #ddd; border-radius:10px; font-size:32px; font-weight:700; letter-spacing:4px; color:#d13232; background:#f9f9f9; margin: 8px 0;">${code}</div>
    <p style="color:#666; font-size:14px;">This verification code expires in <strong>10 minutes</strong>.</p>
    <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
    <p style="color:#999; font-size:12px;">If you did not request this code, you can safely ignore this email. DCamTube will never ask for your code.</p>
  </div>
  `;
}

export async function sendVerificationEmail(to: string, code: string) {
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    const resend = new Resend(resendKey);
    const fromEmail = process.env.EMAIL_FROM || 'DCamTube <noreply@dcamtube.com>';
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'DCamTube: Email Verification',
      html: getEmailHtml(code),
    });

    if (error) {
      console.error('[DCamTube Resend Error]:', error);
      throw new Error('Failed to send email via Resend');
    }

    console.log(`\n[DCamTube OTP] Email: ${to} | OTP: ${code} | Sent via Resend | ID: ${data?.id}\n`);
    return { previewUrl: `https://resend.com/emails/${data?.id}`, via: 'resend' };
  }

  const { transporter, inboxUrl } = await getEtherealTransporter();
  const info = await transporter.sendMail({
    from: '"DCamTube" <noreply@dcamtube.com>',
    to,
    subject: 'DCamTube: Email Verification',
    html: getEmailHtml(code),
  });
  const previewUrl = nodemailer.getTestMessageUrl(info) || inboxUrl;

  console.log(`\n[DCamTube OTP] Email: ${to} | OTP: ${code} | Preview: ${previewUrl}\n`);
  return { previewUrl, via: 'ethereal' };
}
