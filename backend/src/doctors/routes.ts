/**
 * Doctor Routes
 *
 * All authenticated routes require a valid JWT (Bearer token).
 * The doctorId is looked up from the authenticated user's userId.
 *
 * Onboarding wizard endpoints (steps 1–3):
 *   POST /api/v1/doctors/onboarding/profile   → Step 1: Clinic details
 *   POST /api/v1/doctors/onboarding/fees      → Step 2: Consultation fees
 *   POST /api/v1/doctors/onboarding/schedule  → Step 3: Weekly schedule
 *
 * Profile & dashboard:
 *   GET  /api/v1/doctors/profile              → Own full profile
 *   PUT  /api/v1/doctors/profile              → Update profile fields
 *   GET  /api/v1/doctors/dashboard            → Today's stats & appointments
 *   GET  /api/v1/doctors/schedule             → Weekly schedule + blocked dates
 *   POST /api/v1/doctors/blocked-dates        → Block dates
 *   DELETE /api/v1/doctors/blocked-dates      → Unblock dates
 *
 * Public (no auth):
 *   GET  /api/v1/doctors/:slug/public         → Public profile for booking page
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';
import { DoctorService } from './service';
import {
  OnboardingProfileSchema,
  OnboardingFeesSchema,
  OnboardingScheduleSchema,
  UpdateDoctorProfileSchema,
  BlockDatesSchema,
} from './schema';

export const doctorRouter = Router();

// ─── Helper: get doctorId from authenticated user ─────────────────────────────

async function getDoctorId(userId: string): Promise<string | null> {
  const { db } = await import('../shared/database');
  const row = await db.queryOne<{ id: string }>(
    'SELECT id FROM doctors WHERE user_id = $1',
    [userId]
  );
  return row?.id ?? null;
}

function validationError(res: any, errors: any) {
  return res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.flatten() },
  });
}

// ─── Onboarding: Step 1 — Clinic Profile ─────────────────────────────────────

doctorRouter.post(
  '/onboarding/profile',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const parsed = OnboardingProfileSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    try {
      const result = await DoctorService.saveOnboardingProfile(doctorId, req.user!.userId, parsed.data);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error('[ONBOARDING_PROFILE_ERROR]', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to save profile. Database error.' });
    }
  }
);

// ─── Onboarding: Step 2 — Consultation Fees ───────────────────────────────────

doctorRouter.post(
  '/onboarding/fees',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const parsed = OnboardingFeesSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const result = await DoctorService.saveOnboardingFees(doctorId, parsed.data);
    return res.status(result.success ? 200 : 400).json(result);
  }
);

// ─── Onboarding: Step 3 — Weekly Schedule ─────────────────────────────────────

doctorRouter.post(
  '/onboarding/schedule',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const parsed = OnboardingScheduleSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const result = await DoctorService.saveOnboardingSchedule(doctorId, parsed.data);
    return res.status(result.success ? 200 : 400).json(result);
  }
);

// ─── Onboarding: Step 4 — Complete & Payment Setup ─────────────────────────────

doctorRouter.post(
  '/onboarding/complete',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const { upiId, upiQrUrl } = req.body as { upiId?: string; upiQrUrl?: string };
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    try {
      if (upiId || upiQrUrl) {
        await DoctorService.updateUpiInfo(doctorId, { upiId, upiQrUrl });
      }
      const result = await DoctorService.markOnboardingComplete(doctorId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error('[ONBOARDING_COMPLETE_ERROR]', err);
      return res.status(500).json({ success: false, message: 'Failed to complete onboarding. Database error.' });
    }
  }
);

// ─── GET /doctors/profile — authenticated doctor's own full profile ────────────

doctorRouter.get(
  '/profile',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const profile = await DoctorService.getByUserId(req.user!.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    return res.json({ success: true, data: profile });
  }
);

// ─── PUT /doctors/profile — update profile fields ─────────────────────────────

doctorRouter.put(
  '/profile',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const parsed = UpdateDoctorProfileSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const result = await DoctorService.updateProfile(doctorId, req.user!.userId, parsed.data);
    return res.status(result.success ? 200 : 400).json(result);
  }
);

// ─── GET /doctors/dashboard — today's stats + appointments ───────────────────

doctorRouter.get(
  '/dashboard',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const data = await DoctorService.getDashboard(doctorId);
    return res.json({ success: true, data });
  }
);

// ─── GET /doctors/schedule — weekly schedule + blocked dates ──────────────────

doctorRouter.get(
  '/schedule',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const data = await DoctorService.getSchedule(doctorId);
    return res.json({ success: true, data });
  }
);

// ─── POST /doctors/blocked-dates — block dates ────────────────────────────────

doctorRouter.post(
  '/blocked-dates',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const parsed = BlockDatesSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const result = await DoctorService.blockDates(doctorId, parsed.data);
    return res.json(result);
  }
);

// ─── DELETE /doctors/blocked-dates — unblock dates ───────────────────────────

doctorRouter.delete(
  '/blocked-dates',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const { dates } = req.body;
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'dates array is required' } });
    }

    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const result = await DoctorService.unblockDates(doctorId, dates);
    return res.json(result);
  }
);

// ─── GET /doctors/search — search all verified doctors (no auth) ──────────────

doctorRouter.get('/search', async (req, res) => {
  const data = await DoctorService.searchDoctors();
  return res.json({ success: true, data });
});

// ─── GET /doctors/:slug/public — public profile (no auth required) ────────────

doctorRouter.get('/:slug/public', async (req, res) => {
  const profile = await DoctorService.getPublicProfile(req.params.slug);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Doctor not found or booking unavailable.' },
    });
  }
  return res.json({ success: true, data: profile });
});

// ─── GET /doctors/:slug/slots — available slots for a date (no auth) ──────────

doctorRouter.get('/:slug/slots', async (req, res) => {
  const { date } = req.query as { date?: string };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'date query param is required (YYYY-MM-DD)' },
    });
  }
  const result = await DoctorService.getAvailableSlots(req.params.slug, date);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Doctor not found.' },
    });
  }
  return res.json({ success: true, data: result });
});

// ─── PUT /doctors/upi — update UPI payment info ───────────────────────────────

doctorRouter.put(
  '/upi',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const { upiId, upiQrUrl } = req.body as { upiId?: string; upiQrUrl?: string };
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    const result = await DoctorService.updateUpiInfo(doctorId, { upiId, upiQrUrl });
    return res.status(result.success ? 200 : 400).json(result);
  }
);

// ─── Google Calendar OAuth Routes ─────────────────────────────────────────────

doctorRouter.get(
  '/google/auth',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    const { GoogleCalendarService } = await import('./google');
    const url = GoogleCalendarService.getAuthUrl(doctorId);
    return res.json({ success: true, url });
  }
);

doctorRouter.get(
  '/google/callback',
  async (req, res) => {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
    const { env } = await import('../shared/env');
    if (error || !code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/dashboard?google=failed`);
    }

    try {
      const { GoogleCalendarService } = await import('./google');
      const tokens = await GoogleCalendarService.exchangeCodeForTokens(code);
      if (tokens.refreshToken) {
        const { db } = await import('../shared/database');
        await db.query(
          'UPDATE doctors SET google_refresh_token = $1, updated_at = NOW() WHERE id = $2',
          [tokens.refreshToken, state]
        );
      }
      return res.redirect(`${env.FRONTEND_URL}/dashboard?google=success`);
    } catch (err) {
      console.error('[GOOGLE_OAUTH_CALLBACK_ERROR]', err);
      return res.redirect(`${env.FRONTEND_URL}/dashboard?google=failed`);
    }
  }
);

doctorRouter.delete(
  '/google/disconnect',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    const { db } = await import('../shared/database');
    const doc = await db.queryOne<{ google_refresh_token: string | null }>(
      'SELECT google_refresh_token FROM doctors WHERE id = $1',
      [doctorId]
    );
    if (doc?.google_refresh_token) {
      const { GoogleCalendarService } = await import('./google');
      await GoogleCalendarService.revokeToken(doc.google_refresh_token);
    }
    await db.query(
      'UPDATE doctors SET google_refresh_token = NULL, updated_at = NOW() WHERE id = $1',
      [doctorId]
    );
    return res.json({ success: true, message: 'Google Calendar disconnected.' });
  }
);

doctorRouter.get(
  '/google/status',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    const { db } = await import('../shared/database');
    const doc = await db.queryOne<{ google_refresh_token: string | null }>(
      'SELECT google_refresh_token FROM doctors WHERE id = $1',
      [doctorId]
    );
    return res.json({ success: true, connected: !!doc?.google_refresh_token });
  }
);

