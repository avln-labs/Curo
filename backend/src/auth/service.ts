import {
  otpStore,
  userStore,
  refreshTokenStore,
  generateOtp,
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  type UserRole,
  type StoredUser,
} from '../shared/store';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../shared/jwt';
import { env } from '../shared/env';

function sanitizeMobile(raw: string): string {
  // Strip country code prefix if provided (+91, 0091, 91 + 10 digits)
  const stripped = raw.replace(/\D/g, '');
  if (stripped.length === 12 && stripped.startsWith('91')) return stripped.slice(2);
  if (stripped.length === 13 && stripped.startsWith('091')) return stripped.slice(3);
  return stripped;
}

export const AuthService = {
  /**
   * Send OTP to mobile. In dev mode, always issues 123456.
   * In production, integrate an SMS provider (Twilio, MSG91, etc.).
   */
  async sendOtp(rawMobile: string, role: UserRole) {
    const mobile = sanitizeMobile(rawMobile);
    if (!/^\d{10}$/.test(mobile)) {
      return { success: false, message: 'Invalid mobile number. Must be 10 digits.' };
    }

    const otp = generateOtp();
    otpStore.set(mobile, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    // TODO: send real SMS in production
    console.log(`[OTP] ${mobile} → ${otp} (role=${role})`);

    const maskedMobile = `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;
    return {
      success: true,
      message: env.NODE_ENV === 'development'
        ? `OTP sent to ${maskedMobile}. Dev mode: use 123456`
        : `OTP sent to ${maskedMobile}`,
      maskedMobile,
    };
  },

  /**
   * Verify OTP and return JWT access + refresh tokens.
   * Auto-creates a user record if mobile is not found (new sign-up).
   */
  async verifyOtp(rawMobile: string, otp: string, role: UserRole) {
    const mobile = sanitizeMobile(rawMobile);
    const entry = otpStore.get(mobile);

    if (!entry) {
      return { success: false, message: 'OTP not found or expired. Please request a new one.' };
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(mobile);
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }
    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(mobile);
      return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
    }
    if (entry.otp !== otp) {
      entry.attempts++;
      return {
        success: false,
        message: `Incorrect OTP. ${OTP_MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
      };
    }

    // OTP is valid — delete it (single use)
    otpStore.delete(mobile);

    // Find or create user
    let user = userStore.get(mobile);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const newId = `usr_${Date.now()}`;
      user = {
        id: newId,
        mobile,
        role,
        name: role === 'DOCTOR' ? 'New Doctor' : 'New Patient',
        isActive: true,
        createdAt: new Date().toISOString(),
      } satisfies StoredUser;
      userStore.set(mobile, user);
      console.log(`[AUTH] New ${role} registered — ${mobile}`);
    }

    // Issue tokens
    const accessToken = signAccessToken({ userId: user.id, role: user.role, mobile });
    const refreshToken = signRefreshToken(user.id);
    const expiresAt = Date.now() + Number(env.JWT_EXPIRES_IN) * 1000;

    refreshTokenStore.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + Number(env.REFRESH_TOKEN_EXPIRES_IN) * 1000,
    });

    return {
      success: true,
      message: isNewUser ? 'Account created. Welcome to CURO!' : 'Login successful',
      isNewUser,
      accessToken,
      refreshToken,
      expiresAt,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        email: user.email,
        slug: user.slug,
        doctorId: user.doctorId,
        patientId: user.patientId,
        needsOnboarding: isNewUser && role === 'DOCTOR',
      },
    };
  },

  /** Rotate access token using refresh token */
  async refreshToken(refreshToken: string) {
    const entry = refreshTokenStore.get(refreshToken);
    if (!entry || Date.now() > entry.expiresAt) {
      return { success: false, message: 'Refresh token invalid or expired' };
    }

    // Find the user
    const user = [...userStore.values()].find((u) => u.id === entry.userId);
    if (!user) return { success: false, message: 'User not found' };

    const newAccessToken = signAccessToken({ userId: user.id, role: user.role, mobile: user.mobile });
    return {
      success: true,
      accessToken: newAccessToken,
      expiresAt: Date.now() + Number(env.JWT_EXPIRES_IN) * 1000,
    };
  },

  /** Revoke refresh token (logout) */
  async logout(refreshToken: string) {
    refreshTokenStore.delete(refreshToken);
    return { success: true, message: 'Logged out successfully' };
  },
};
