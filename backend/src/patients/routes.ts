/**
 * Patient Routes
 *
 * GET  /api/v1/patients/me          → Authenticated patient's own profile
 * PUT  /api/v1/patients/me          → Update own profile (name, age, gender, etc.)
 * GET  /api/v1/patients/me/records  → Full health thread (appointments + Rx + docs)
 *
 * Doctor-access:
 * GET  /api/v1/patients/:id         → Get any patient by ID (doctor/admin only)
 * GET  /api/v1/patients/:id/records → Patient health thread (doctor/admin only)
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';
import { PatientService } from './service';
import { UpdatePatientProfileSchema } from './schema';

export const patientRouter = Router();

function validationError(res: any, errors: any) {
  return res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.flatten() },
  });
}

// ─── GET /patients/me — authenticated patient's own profile ──────────────────

patientRouter.get('/me', requireAuth, requireRole('PATIENT'), async (req: AuthRequest, res) => {
  const patient = await PatientService.getByUserId(req.user!.userId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Patient profile not found.' },
    });
  }
  return res.json({ success: true, data: patient });
});

// ─── PUT /patients/me — update own profile ────────────────────────────────────

patientRouter.put('/me', requireAuth, requireRole('PATIENT'), async (req: AuthRequest, res) => {
  const parsed = UpdatePatientProfileSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  // Look up patientId from userId
  const { db } = await import('../shared/database');
  const row = await db.queryOne<{ id: string }>(
    'SELECT id FROM patients WHERE user_id = $1',
    [req.user!.userId]
  );

  if (!row) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Patient profile not found.' },
    });
  }

  const result = await PatientService.updateProfile(row.id, req.user!.userId, parsed.data);
  return res.status(result.success ? 200 : 400).json(result);
});

// ─── GET /patients/me/records — own health thread ─────────────────────────────

patientRouter.get('/me/records', requireAuth, requireRole('PATIENT'), async (req: AuthRequest, res) => {
  const { db } = await import('../shared/database');
  const row = await db.queryOne<{ id: string }>(
    'SELECT id FROM patients WHERE user_id = $1',
    [req.user!.userId]
  );

  if (!row) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Patient profile not found.' },
    });
  }

  const records = await PatientService.getHealthThread(row.id);
  return res.json({ success: true, data: records });
});

// ─── GET /patients/:id — doctor/admin can view any patient ───────────────────

patientRouter.get('/:id', requireAuth, requireRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const patient = await PatientService.getById(req.params.id);
  if (!patient) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Patient not found.' },
    });
  }
  return res.json({ success: true, data: patient });
});

// ─── GET /patients/:id/records — doctor/admin can view patient health thread ──

patientRouter.get('/:id/records', requireAuth, requireRole('DOCTOR', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const records = await PatientService.getHealthThread(req.params.id);
  return res.json({ success: true, data: records });
});
