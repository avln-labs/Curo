import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from './service';
import { requireAuth } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';

export const authRouter = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SendOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  purpose: z.enum(['login', 'register']).default('login'),
});

const VerifyOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  otp: z.string().length(6),
  role: z.enum(['DOCTOR', 'PATIENT']),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const LogoutSchema = z.object({
  refreshToken: z.string().min(10),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/otp/send
 * Body: { mobile, purpose? }
 * Response: { success, message, maskedMobile, expiresIn }
 */
authRouter.post('/otp/send', async (req, res) => {
  const parsed = SendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() },
    });
  }

  const result = await AuthService.sendOtp(parsed.data.mobile, parsed.data.purpose);
  return res.status(result.success ? 200 : 400).json(result);
});

/**
 * POST /api/v1/auth/otp/verify
 * Body: { mobile, otp, role }
 * Response: { success, isNewUser, accessToken, refreshToken, expiresIn, user }
 */
authRouter.post('/otp/verify', async (req, res) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() },
    });
  }

  try {
    const result = await AuthService.verifyOtp(
      parsed.data.mobile,
      parsed.data.otp,
      parsed.data.role
    );
    const status = result.success ? 200 : (result.code === 'FORBIDDEN' ? 403 : 401);
    return res.status(status).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[AUTH] verifyOtp error:', message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
});

/**
 * POST /api/v1/auth/token/refresh
 * Body: { refreshToken }
 * Response: { success, accessToken, expiresIn }
 */
authRouter.post('/token/refresh', async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'refreshToken is required' },
    });
  }

  const result = await AuthService.refreshToken(parsed.data.refreshToken);
  return res.status(result.success ? 200 : 401).json(result);
});

/**
 * POST /api/v1/auth/logout
 * Body: { refreshToken }
 * Response: { success, message }
 */
authRouter.post('/logout', async (req, res) => {
  const parsed = LogoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'refreshToken is required' },
    });
  }

  const result = await AuthService.logout(parsed.data.refreshToken);
  return res.json(result);
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's full profile from DB.
 */
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const result = await AuthService.getMe(userId);
  return res.status(result.success ? 200 : 404).json(result);
});
