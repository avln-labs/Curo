/**
 * CURO Auth Service
 *
 * Handles OTP-based authentication for both Doctors and Patients.
 * Primary state persistence: PostgreSQL (Supabase)
 * Fallback: in-memory store (when DB is offline/not yet configured)
 *
 * Flow:
 *   1. POST /auth/otp/send   → generate & send OTP via Twilio or console
 *   2. POST /auth/otp/verify → verify OTP → create user if new → return JWT pair
 *   3. POST /auth/token/refresh → rotate access token using refresh token
 *   4. POST /auth/logout     → revoke refresh token
 */

import crypto from 'crypto';
import { OtpService, sanitizeMobile, isValidIndianMobile } from '../shared/otp';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../shared/jwt';
import { db } from '../shared/database';
import { env } from '../shared/env';
import type { UserRole } from '../shared/store';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSlug(_name: string): string {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `dr-${suffix}`.slice(0, 40);
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  mobile: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
}

interface DoctorRow {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  verification_status: string;
  booking_link_active: boolean;
  onboarding_step: number;
}

interface PatientRow {
  id: string;
  user_id: string;
  full_name: string;
  onboarding_complete: boolean;
  gender?: string | null;
  age?: number | null;
  date_of_birth?: string | null;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
}

// ─── In-memory fallback stores (used when DB is offline / not yet set up) ────
// Cleared on server restart — for dev/demo mode only.
interface InMemUser { id: string; mobile: string; email: string | null; role: UserRole; is_active: boolean; }
interface InMemDoctor { id: string; user_id: string; slug: string; full_name: string; verification_status: string; booking_link_active: boolean; onboarding_step: number; }
interface InMemPatient { id: string; user_id: string; full_name: string; onboarding_complete: boolean; gender: string | null; age: number | null; date_of_birth?: string | null; }
interface InMemRefresh { userId: string; expiresAt: number; }

const memUsers = new Map<string, InMemUser>();          // mobile → user
const memDoctors = new Map<string, InMemDoctor>();      // userId → doctor
const memPatients = new Map<string, InMemPatient>();    // userId → patient
const memRefreshTokens = new Map<string, InMemRefresh>(); // tokenHash → data

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * Step 1: Send OTP
   * The role is NOT required here — just the mobile number.
   * Role is provided at verify time.
   */
  async sendOtp(rawMobile: string, purpose: 'login' | 'register' = 'login') {
    const mobile = sanitizeMobile(rawMobile);

    if (!isValidIndianMobile(mobile)) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid mobile number. Must be a 10-digit Indian number starting with 6–9.',
      };
    }

    return OtpService.send(mobile, purpose);
  },

  /**
   * Step 2: Verify OTP and return JWT tokens.
   * - If user exists (returning): issues tokens, updates last_login_at
   * - If user does not exist (new): creates users row + doctor/patient profile row
   * Falls back to in-memory if DB is unreachable.
   */
  async verifyOtp(rawMobile: string, otp: string, role: UserRole) {
    const mobile = sanitizeMobile(rawMobile);

    if (!isValidIndianMobile(mobile)) {
      return { success: false, code: 'VALIDATION_ERROR', message: 'Invalid mobile number.' };
    }

    // Verify OTP (handles both DB and in-memory stores)
    const otpResult = await OtpService.verify(mobile, otp);
    if (!otpResult.valid) {
      return { success: false, code: 'UNAUTHENTICATED', message: otpResult.message };
    }

    // ── Find or create user — try DB first, fallback to in-memory ────────────
    let userId: string;
    let userRole: UserRole;
    let userEmail: string | null = null;
    let isNewUser = false;
    let dbAvailable = true;
    let doctorProfile: DoctorRow | InMemDoctor | null = null;
    let patientProfile: PatientRow | InMemPatient | null = null;

    try {
      // ── DB path ──
      let user = await db.queryOne<UserRow>(
        'SELECT id, mobile, email, role, is_active, last_login_at FROM users WHERE mobile = $1 AND deleted_at IS NULL',
        [mobile]
      );

      if (!user) {
        isNewUser = true;
        user = await db.queryOne<UserRow>(
          `INSERT INTO users (mobile, role) VALUES ($1, $2)
           RETURNING id, mobile, email, role, is_active, last_login_at`,
          [mobile, role]
        );
        if (!user) throw new Error('Failed to create user record');

        if (role === 'DOCTOR') {
          const slug = generateSlug('doctor');
          doctorProfile = await db.queryOne<DoctorRow>(
            `INSERT INTO doctors (user_id, slug, full_name, verification_status, booking_link_active, onboarding_step)
             VALUES ($1, $2, $3, 'pending', false, 0)
             RETURNING id, user_id, slug, full_name, verification_status, booking_link_active, onboarding_step`,
            [user.id, slug, '']
          );
          await db.query(
            `INSERT INTO doctor_settings (doctor_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [doctorProfile?.id]
          );
        } else if (role === 'PATIENT') {
          patientProfile = await db.queryOne<PatientRow>(
            `INSERT INTO patients (user_id, full_name, onboarding_complete)
             VALUES ($1, $2, false)
             RETURNING id, user_id, full_name, onboarding_complete, gender, age`,
            [user.id, '']
          );
        }
        console.log(`[AUTH] New ${role} registered (DB) — ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`);
      } else {
        if (user.role !== role) {
          return { success: false, code: 'FORBIDDEN', message: `This number is registered as a ${user.role.toLowerCase()}. Please select the correct role.` };
        }
        if (!user.is_active) {
          return { success: false, code: 'FORBIDDEN', message: 'Your account has been suspended.' };
        }
        if (role === 'DOCTOR') {
          doctorProfile = await db.queryOne<DoctorRow>(
            `SELECT id, user_id, slug, full_name, verification_status, booking_link_active, onboarding_step FROM doctors WHERE user_id = $1`,
            [user.id]
          );
          if (!doctorProfile) {
            const slug = generateSlug('doctor');
            doctorProfile = await db.queryOne<DoctorRow>(
              `INSERT INTO doctors (user_id, slug, full_name, verification_status, booking_link_active, onboarding_step)
               VALUES ($1, $2, $3, 'pending', false, 0)
               RETURNING id, user_id, slug, full_name, verification_status, booking_link_active, onboarding_step`,
              [user.id, slug, '']
            );
            await db.query(
              `INSERT INTO doctor_settings (doctor_id) VALUES ($1) ON CONFLICT DO NOTHING`,
              [doctorProfile?.id]
            );
          }
        } else if (role === 'PATIENT') {
          patientProfile = await db.queryOne<PatientRow>(
            `SELECT id, user_id, full_name, onboarding_complete, gender, age, date_of_birth FROM patients WHERE user_id = $1`,
            [user.id]
          );
          if (!patientProfile) {
            patientProfile = await db.queryOne<PatientRow>(
              `INSERT INTO patients (user_id, full_name, onboarding_complete)
               VALUES ($1, $2, false)
               RETURNING id, user_id, full_name, onboarding_complete, gender, age, date_of_birth`,
              [user.id, '']
            );
          }
        }
      }

      userId = user.id;
      userRole = user.role;
      userEmail = user.email;

      await db.query(
        `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [userId]
      );

    } catch (err: unknown) {
      // ── In-memory fallback (DB offline / not yet configured) ─────────────────
      dbAvailable = false;
      console.warn(`[AUTH] DB unavailable, using in-memory fallback. (${err instanceof Error ? err.message : String(err)})`);

      let memUser = memUsers.get(mobile);
      if (!memUser) {
        isNewUser = true;
        const newId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        memUser = { id: newId, mobile, email: null, role, is_active: true };
        memUsers.set(mobile, memUser);

        if (role === 'DOCTOR') {
          const slug = `dr-${crypto.randomBytes(4).toString('hex')}`;
          const doc: InMemDoctor = { id: `doc_${Date.now()}`, user_id: newId, slug, full_name: '', verification_status: 'pending', booking_link_active: false, onboarding_step: 0 };
          memDoctors.set(newId, doc);
          doctorProfile = doc;
        } else if (role === 'PATIENT') {
          const pat: InMemPatient = { id: `pat_${Date.now()}`, user_id: newId, full_name: '', onboarding_complete: false, gender: null, age: null };
          memPatients.set(newId, pat);
          patientProfile = pat;
        }
        console.log(`[AUTH] New ${role} created in-memory — ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`);
      } else {
        if (memUser.role !== role) {
          return { success: false, code: 'FORBIDDEN', message: `This number is registered as a ${memUser.role.toLowerCase()}. Please select the correct role.` };
        }
        if (role === 'DOCTOR') {
          doctorProfile = memDoctors.get(memUser.id) ?? null;
          if (!doctorProfile) {
            const slug = `dr-${crypto.randomBytes(4).toString('hex')}`;
            const doc: InMemDoctor = { id: `doc_${Date.now()}`, user_id: memUser.id, slug, full_name: '', verification_status: 'pending', booking_link_active: false, onboarding_step: 0 };
            memDoctors.set(memUser.id, doc);
            doctorProfile = doc;
          }
        } else if (role === 'PATIENT') {
          patientProfile = memPatients.get(memUser.id) ?? null;
          if (!patientProfile) {
            const pat: InMemPatient = { id: `pat_${Date.now()}`, user_id: memUser.id, full_name: '', onboarding_complete: false, gender: null, age: null };
            memPatients.set(memUser.id, pat);
            patientProfile = pat;
          }
        }
      }

      userId = memUser.id;
      userRole = memUser.role;
    }

    // Issue JWT tokens
    const accessToken = signAccessToken({ userId, role: userRole, mobile });
    const rawRefreshToken = signRefreshToken(userId);
    const tokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + Number(env.REFRESH_TOKEN_EXPIRES_IN) * 1000);

    if (dbAvailable) {
      try {
        await db.query(
          `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
          [userId, tokenHash, refreshExpiresAt]
        );
      } catch {
        memRefreshTokens.set(tokenHash, { userId, expiresAt: refreshExpiresAt.getTime() });
      }
    } else {
      memRefreshTokens.set(tokenHash, { userId, expiresAt: refreshExpiresAt.getTime() });
    }

    const userPayload: Record<string, unknown> = {
      id: userId,
      mobile,
      email: userEmail,
      role: userRole,
    };

    if (doctorProfile) {
      userPayload.doctorId = doctorProfile.id;
      userPayload.slug = doctorProfile.slug;
      userPayload.fullName = doctorProfile.full_name;
      userPayload.verificationStatus = doctorProfile.verification_status;
      userPayload.bookingLinkActive = doctorProfile.booking_link_active;
      userPayload.onboardingStep = doctorProfile.onboarding_step;
      userPayload.needsOnboarding = doctorProfile.onboarding_step < 5;
    }

    if (patientProfile) {
      userPayload.patientId = patientProfile.id;
      userPayload.fullName = patientProfile.full_name;
      userPayload.onboardingComplete = patientProfile.onboarding_complete;
      userPayload.needsOnboarding = !patientProfile.onboarding_complete;
      userPayload.gender = patientProfile.gender;
      userPayload.age = patientProfile.age;
      userPayload.date_of_birth = patientProfile.date_of_birth;
    }

    return {
      success: true,
      message: isNewUser ? 'Account created. Welcome to CURO!' : 'Login successful.',
      isNewUser,
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: Number(env.JWT_EXPIRES_IN),
      user: userPayload,
    };
  },

  /** Rotate access token using a valid refresh token */
  async refreshToken(rawRefreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      return { success: false, code: 'UNAUTHENTICATED', message: 'Refresh token invalid or expired.' };
    }

    const tokenHash = hashToken(rawRefreshToken);

    // Try DB first
    try {
      const tokenRecord = await db.queryOne<RefreshTokenRow>(
        `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens
         WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
        [tokenHash]
      );

      if (tokenRecord && tokenRecord.user_id === payload.userId) {
        const user = await db.queryOne<UserRow>(
          'SELECT id, mobile, role, is_active FROM users WHERE id = $1',
          [payload.userId]
        );
        if (!user || !user.is_active) {
          return { success: false, code: 'FORBIDDEN', message: 'User not found or suspended.' };
        }
        const newAccessToken = signAccessToken({ userId: user.id, role: user.role, mobile: user.mobile });
        return { success: true, accessToken: newAccessToken, expiresIn: Number(env.JWT_EXPIRES_IN) };
      }
    } catch {
      // DB offline — check in-memory
    }

    // In-memory fallback
    const memEntry = memRefreshTokens.get(tokenHash);
    if (!memEntry || Date.now() > memEntry.expiresAt || memEntry.userId !== payload.userId) {
      return { success: false, code: 'UNAUTHENTICATED', message: 'Refresh token not found or revoked.' };
    }

    // Reconstruct user from in-memory store
    const memUser = [...memUsers.values()].find(u => u.id === payload.userId);
    if (!memUser) {
      return { success: false, code: 'NOT_FOUND', message: 'User not found.' };
    }
    const newAccessToken = signAccessToken({ userId: memUser.id, role: memUser.role, mobile: memUser.mobile });
    return { success: true, accessToken: newAccessToken, expiresIn: Number(env.JWT_EXPIRES_IN) };
  },

  /** Revoke a refresh token (logout) */
  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);

    // Try DB
    try {
      await db.query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
        [tokenHash]
      );
    } catch {
      // DB offline — remove from in-memory
      memRefreshTokens.delete(tokenHash);
    }

    // Also clear from in-memory (belt + suspenders)
    memRefreshTokens.delete(tokenHash);
    return { success: true, message: 'Logged out successfully.' };
  },

  /** Get full profile for the currently authenticated user */
  async getMe(userId: string) {
    try {
      const user = await db.queryOne<UserRow>(
        'SELECT id, mobile, email, role, is_active FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (!user) return { success: false, code: 'NOT_FOUND', message: 'User not found.' };

      const payload: Record<string, unknown> = {
        id: user.id,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
      };

      if (user.role === 'DOCTOR') {
        const doc = await db.queryOne<DoctorRow>(
          `SELECT id, slug, full_name, verification_status, booking_link_active, onboarding_step FROM doctors WHERE user_id = $1`,
          [userId]
        );
        if (doc) {
          payload.doctorId = doc.id;
          payload.slug = doc.slug;
          payload.fullName = doc.full_name;
          payload.verificationStatus = doc.verification_status;
          payload.bookingLinkActive = doc.booking_link_active;
          payload.onboardingStep = doc.onboarding_step;
          payload.needsOnboarding = doc.onboarding_step < 5;
        }
      } else if (user.role === 'PATIENT') {
        const pat = await db.queryOne<PatientRow>(
          'SELECT id, full_name, onboarding_complete, gender, age, date_of_birth FROM patients WHERE user_id = $1',
          [userId]
        );
        if (pat) {
          payload.patientId = pat.id;
          payload.fullName = pat.full_name;
          payload.onboardingComplete = pat.onboarding_complete;
          payload.needsOnboarding = !pat.onboarding_complete;
          payload.gender = pat.gender;
          payload.age = pat.age;
          payload.date_of_birth = pat.date_of_birth;
        }
      }

      return { success: true, user: payload };
    } catch {
      // Fallback to in-memory
      const memUser = [...memUsers.values()].find(u => u.id === userId);
      if (!memUser) return { success: false, code: 'NOT_FOUND', message: 'User not found.' };

      const payload: Record<string, unknown> = {
        id: memUser.id,
        mobile: memUser.mobile,
        email: memUser.email,
        role: memUser.role,
        isActive: memUser.is_active,
      };

      const doc = memDoctors.get(memUser.id);
      if (doc) {
        payload.doctorId = doc.id;
        payload.slug = doc.slug;
        payload.fullName = doc.full_name;
        payload.verificationStatus = doc.verification_status;
        payload.bookingLinkActive = doc.booking_link_active;
        payload.onboardingStep = doc.onboarding_step;
        payload.needsOnboarding = doc.onboarding_step < 5;
      }

      const pat = memPatients.get(memUser.id);
      if (pat) {
        payload.patientId = pat.id;
        payload.fullName = pat.full_name;
      }

      return { success: true, user: payload };
    }
  },
};
