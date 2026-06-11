import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from './service';
import { requireAuth } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';

export const authRouter = Router();

const SendOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  role: z.enum(['DOCTOR', 'PATIENT']),
});

const VerifyOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  otp: z.string().length(6),
  role: z.enum(['DOCTOR', 'PATIENT']),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

/** POST /api/v1/auth/otp/send */
authRouter.post('/otp/send', async (req, res) => {
  const parsed = SendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() });
  }
  const result = await AuthService.sendOtp(parsed.data.mobile, parsed.data.role);
  return res.status(result.success ? 200 : 400).json(result);
});

/** POST /api/v1/auth/otp/verify */
authRouter.post('/otp/verify', async (req, res) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: parsed.error.flatten() });
  }
  const result = await AuthService.verifyOtp(parsed.data.mobile, parsed.data.otp, parsed.data.role);
  return res.status(result.success ? 200 : 401).json(result);
});

/** POST /api/v1/auth/token/refresh */
authRouter.post('/token/refresh', async (req, res) => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'refreshToken is required' });
  }
  const result = await AuthService.refreshToken(parsed.data.refreshToken);
  return res.status(result.success ? 200 : 401).json(result);
});

/** POST /api/v1/auth/logout */
authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'refreshToken is required' });
  const result = await AuthService.logout(refreshToken);
  return res.json(result);
});

/** GET /api/v1/auth/me — returns current user from token */
authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  return res.json({ success: true, user: req.user });
});
