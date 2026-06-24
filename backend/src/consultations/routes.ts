/**
 * Consultations Routes
 *
 * GET  /api/v1/consultations/today          → Doctor's appointments for today
 * GET  /api/v1/consultations/past           → Doctor's past appointments
 * GET  /api/v1/consultations/:id            → Single appointment detail
 * POST /api/v1/consultations/:id/start      → Mark as LIVE, save meet link
 * POST /api/v1/consultations/:id/complete   → Mark as COMPLETED (blocked w/o Rx)
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';
import { ConsultationsService } from './service';

export const consultationRouter = Router();

// Helper
async function getDoctorId(userId: string): Promise<string | null> {
  const { db } = await import('../shared/database');
  const row = await db.queryOne<{ id: string }>(
    'SELECT id FROM doctors WHERE user_id = $1',
    [userId]
  );
  return row?.id ?? null;
}

// ─── GET /consultations/today ────────────────────────────────────────────────

consultationRouter.get(
  '/today',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    const data = await ConsultationsService.getTodaysAppointments(doctorId);
    return res.json({ success: true, data });
  }
);

// ─── GET /consultations/past ─────────────────────────────────────────────────

consultationRouter.get(
  '/past',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    const data = await ConsultationsService.getPastAppointments(doctorId, limit);
    return res.json({ success: true, data });
  }
);

// ─── GET /consultations/:id ──────────────────────────────────────────────────

consultationRouter.get(
  '/:id',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    const data = await ConsultationsService.getAppointment(req.params.id, doctorId);
    if (!data) return res.status(404).json({ success: false, error: { message: 'Appointment not found.' } });
    return res.json({ success: true, data });
  }
);

// ─── POST /consultations/:id/start ───────────────────────────────────────────

consultationRouter.post(
  '/:id/start',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const { meetLink } = req.body as { meetLink?: string };
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    const result = await ConsultationsService.startConsultation(req.params.id, doctorId, meetLink);
    return res.status(result.success ? 200 : 400).json(result);
  }
);

// ─── POST /consultations/:id/complete ────────────────────────────────────────

consultationRouter.post(
  '/:id/complete',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const doctorId = await getDoctorId(req.user!.userId);
    if (!doctorId) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    const result = await ConsultationsService.completeConsultation(req.params.id, doctorId);
    return res.status(result.success ? 200 : 400).json(result);
  }
);
