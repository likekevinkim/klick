// lib/otpSession.js
// Server-only helpers for the email-OTP signup cookie. The OTP code and its
// expiry travel to the browser inside a cookie (this app is serverless, so
// there's no session store to keep it in) — signOtpSession/verifyOtpSession
// HMAC-sign that payload so a forged or edited cookie value is rejected
// instead of trusted, and verifyOtpSession also enforces a max-attempt count
// to stop brute-forcing the 6-digit code.
import crypto from 'crypto';

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const OTP_MAX_ATTEMPTS = 5;

function hmac(payloadStr) {
  if (!SECRET) throw new Error('Server misconfiguration: missing OTP signing secret.');
  return crypto.createHmac('sha256', SECRET).update(payloadStr).digest('hex');
}

export function signOtpSession({ email, code, expiresAt, attempts = 0 }) {
  const payloadStr = JSON.stringify({ email, code, expiresAt, attempts });
  const sig = hmac(payloadStr);
  return `${Buffer.from(payloadStr).toString('base64')}.${sig}`;
}

// Returns the decoded { email, code, expiresAt, attempts } or null if the
// cookie is missing, malformed, or its signature doesn't match (tampered/forged).
export function verifyOtpSession(cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;

  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const encodedPayload = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);

  let payloadStr;
  try {
    payloadStr = Buffer.from(encodedPayload, 'base64').toString('utf-8');
  } catch {
    return null;
  }

  let expectedSig;
  try {
    expectedSig = hmac(payloadStr);
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

export function constantTimeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
