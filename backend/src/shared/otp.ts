/**
 * CURO OTP Service
 *
 * Provider modes (controlled by OTP_PROVIDER env var):
 *   console  — prints OTP to terminal; always uses 123456 for easy dev testing
 *   twilio   — sends real SMS via Twilio (India numbers only)
 *
 * OTP records are stored in the `otp_codes` table (bcrypt-hashed).
 * Falls back to in-memory store if the DB is unreachable (offline/demo mode).
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from './env';
import { db } from './database';

// ── In-memory fallback (used when DB is offline) ──────────────────────────────
const inMemoryOtpStore = new Map<string, {
  otpHash: string;
  expiresAt: number;
  attempts: number;
}>();

const OTP_TTL_MS = 5 * 60 * 1000;    // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOtp(): string {
  // In console/dev mode always 123456 so offline frontend still works
  if (env.OTP_PROVIDER === 'console') return '123456';
  return crypto.randomInt(100000, 999999).toString();
}

export function sanitizeMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
  return digits;
}

export function isValidIndianMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

// ── Twilio sender ─────────────────────────────────────────────────────────────

async function sendViaTwilio(mobile: string, otp: string): Promise<void> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) {
    throw new Error('Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM in .env');
  }

  // Dynamic import so the module doesn't fail when Twilio isn't configured
  const twilio = await import('twilio');
  const client = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  const formattedNumber = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  await client.messages.create({
    to: formattedNumber,
    from: env.TWILIO_FROM,
    body: `Your CURO OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
  });
}

// ── OTP Store (DB with in-memory fallback) ─────────────────────────────────────

async function storeOtp(mobile: string, otp: string, purpose: string): Promise<void> {
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  try {
    // Invalidate any existing unused OTPs for this mobile
    await db.query(
      `UPDATE otp_codes SET used_at = NOW() 
       WHERE mobile = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [mobile]
    );
    // Insert new OTP
    await db.query(
      `INSERT INTO otp_codes (mobile, otp_hash, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [mobile, otpHash, purpose, expiresAt]
    );
  } catch {
    // DB offline — use in-memory fallback
    inMemoryOtpStore.set(mobile, { otpHash, expiresAt: expiresAt.getTime(), attempts: 0 });
  }
}

async function verifyAndConsumeOtp(mobile: string, otp: string): Promise<{
  valid: boolean;
  message: string;
}> {
  // ── Try DB first ──
  try {
    const record = await db.queryOne<{
      id: string;
      otp_hash: string;
      attempts: number;
      expires_at: string;
    }>(
      `SELECT id, otp_hash, attempts, expires_at FROM otp_codes
       WHERE mobile = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [mobile]
    );

    if (!record) {
      return { valid: false, message: 'OTP not found or expired. Please request a new one.' };
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await db.query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [record.id]);
      return { valid: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    const match = await bcrypt.compare(otp, record.otp_hash);
    if (!match) {
      await db.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
      const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
      return {
        valid: false,
        message: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Incorrect OTP. No attempts remaining. Please request a new one.',
      };
    }

    // Mark as used
    await db.query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [record.id]);
    return { valid: true, message: 'OTP verified' };

  } catch {
    // ── DB offline: fall back to in-memory ──
    const entry = inMemoryOtpStore.get(mobile);
    if (!entry) return { valid: false, message: 'OTP not found or expired.' };
    if (Date.now() > entry.expiresAt) {
      inMemoryOtpStore.delete(mobile);
      return { valid: false, message: 'OTP has expired.' };
    }
    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      inMemoryOtpStore.delete(mobile);
      return { valid: false, message: 'Too many attempts.' };
    }

    const match = await bcrypt.compare(otp, entry.otpHash);
    if (!match) {
      entry.attempts++;
      return { valid: false, message: `Incorrect OTP. ${OTP_MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
    }

    inMemoryOtpStore.delete(mobile);
    return { valid: true, message: 'OTP verified' };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const OtpService = {
  /**
   * Generate and send an OTP to the given mobile number.
   * Returns the masked mobile and expiry info.
   */
  async send(rawMobile: string, purpose: 'login' | 'register' = 'login'): Promise<{
    success: boolean;
    message: string;
    maskedMobile?: string;
    expiresIn?: number;
  }> {
    const mobile = sanitizeMobile(rawMobile);

    if (!isValidIndianMobile(mobile)) {
      return { success: false, message: 'Invalid mobile number. Must be a 10-digit Indian number starting with 6–9.' };
    }

    const otp = generateOtp();
    await storeOtp(mobile, otp, purpose);

    const maskedMobile = `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;

    if (env.OTP_PROVIDER === 'twilio') {
      try {
        await sendViaTwilio(mobile, otp);
        console.log(`[OTP] SMS sent to ${maskedMobile} via Twilio`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[OTP] Twilio send failed:`, message);
        return { success: false, message: 'Failed to send OTP via SMS. Please try again.' };
      }
    } else {
      // Console mode — print OTP to terminal
      console.log(`\n[OTP] ──────────────────────────────────`);
      console.log(`[OTP]  Mobile : ${mobile}`);
      console.log(`[OTP]  OTP    : ${otp}  (console mode)`);
      console.log(`[OTP] ──────────────────────────────────\n`);
    }

    return {
      success: true,
      message: env.OTP_PROVIDER === 'console'
        ? `OTP sent to ${maskedMobile}. Dev mode: use 123456`
        : `OTP sent to ${maskedMobile}`,
      maskedMobile,
      expiresIn: OTP_TTL_MS / 1000,
    };
  },

  /** Verify an OTP submitted by the user. Consumes it on success. */
  async verify(rawMobile: string, otp: string): Promise<{ valid: boolean; message: string }> {
    const mobile = sanitizeMobile(rawMobile);
    return verifyAndConsumeOtp(mobile, otp);
  },
};
