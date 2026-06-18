/**
 * Shared store — legacy in-memory fallback
 *
 * In production: auth uses the PostgreSQL database (see auth/service.ts).
 * This file is kept for:
 *   1. The OTP in-memory map (used by OtpService when DB is offline)
 *   2. Type definitions consumed by jwt.ts
 *
 * The userStore / refreshTokenStore from the old prototype have been
 * removed — they now live in the `users` and `refresh_tokens` DB tables.
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'CLINIC_STAFF' | 'PATIENT';

// OTP TTL / attempt constants (also used by otp.ts for in-memory fallback)
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 3;
