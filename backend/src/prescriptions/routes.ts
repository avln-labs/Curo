/**
 * Prescriptions Routes
 *
 * POST /api/v1/prescriptions                    → Create prescription
 * GET  /api/v1/prescriptions/:id                → Get prescription detail
 * GET  /api/v1/prescriptions/:id/pdf            → Download PDF
 * GET  /api/v1/prescriptions/appointment/:id    → Get prescription by appointment ID
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';
import { PrescriptionsService } from './service';
import { z } from 'zod';
import { db } from '../shared/database';

export const prescriptionRouter = Router();

function validationError(res: any, errors: any) {
  return res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.flatten() },
  });
}

const CreatePrescriptionSchema = z.object({
  appointmentId: z.string().uuid(),
  diagnosis: z.string().optional(),
  investigations: z.string().optional(),
  advice: z.string().optional(),
  followupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  medications: z.array(z.object({
    drugName: z.string().min(1),
    dose: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
  })).min(1, 'At least one medication is required'),
});

// ─── POST /prescriptions ─────────────────────────────────────────────────────

prescriptionRouter.post(
  '/',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    const parsed = CreatePrescriptionSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    // Get doctor
    const doctorRow = await db.queryOne<{ id: string }>(
      'SELECT id FROM doctors WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!doctorRow) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    // Validate appointment belongs to doctor
    const appt = await db.queryOne<{ patient_id: string; doctor_id: string }>(
      'SELECT patient_id, doctor_id FROM appointments WHERE id = $1',
      [parsed.data.appointmentId]
    );
    if (!appt || appt.doctor_id !== doctorRow.id) {
      return res.status(404).json({ success: false, error: { message: 'Appointment not found or not yours.' } });
    }

    const result = await PrescriptionsService.createPrescription({
      ...parsed.data,
      doctorId: doctorRow.id,
      patientId: appt.patient_id,
    });

    return res.status(result.success ? 201 : 400).json(result);
  }
);

// ─── GET /prescriptions/my ───────────────────────────────────────────────────

prescriptionRouter.get(
  '/my',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    // Get doctor
    const doctorRow = await db.queryOne<{ id: string }>(
      'SELECT id FROM doctors WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!doctorRow) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

    const data = await PrescriptionsService.getByDoctorId(doctorRow.id);
    return res.json({ success: true, data });
  }
);

// ─── GET /prescriptions/:id ──────────────────────────────────────────────────

prescriptionRouter.get(
  '/:id',
  requireAuth,
  async (req: AuthRequest, res) => {
    const data = await PrescriptionsService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: { message: 'Prescription not found.' } });
    return res.json({ success: true, data });
  }
);

// ─── GET /prescriptions/:id/pdf ──────────────────────────────────────────────

prescriptionRouter.get(
  '/:id/pdf',
  // Note: No auth middleware here so the patient can download it directly via link
  // In a real app we'd use signed URLs or pass a token in query string
  async (req, res) => {
    try {
      const buffer = await PrescriptionsService.generatePdfBuffer(req.params.id);
      if (!buffer) return res.status(404).json({ success: false, error: { message: 'Prescription not found.' } });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Prescription_${req.params.id}.pdf`);
      res.send(buffer);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to generate PDF.' } });
    }
  }
);

// ─── GET /prescriptions/appointment/:id ──────────────────────────────────────

prescriptionRouter.get(
  '/appointment/:appointmentId',
  requireAuth,
  async (req: AuthRequest, res) => {
    const data = await PrescriptionsService.getByAppointmentId(req.params.appointmentId);
    if (!data) return res.status(404).json({ success: false, error: { message: 'No prescription found for this appointment.' } });
    return res.json({ success: true, data });
  }
);
