/**
 * Bookings Routes
 *
 * POST   /api/v1/bookings            → Create appointment (patient auth required)
 * POST   /api/v1/bookings/:id/confirm → Patient confirms UPI payment
 * GET    /api/v1/bookings/my         → Patient's own appointments
 * GET    /api/v1/bookings/:id        → Single appointment detail
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';
import { BookingsService } from './service';
import { db } from '../shared/database';
import { z } from 'zod';

export const bookingRouter = Router();

function validationError(res: any, errors: any) {
  return res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.flatten() },
  });
}

const CreateBookingSchema = z.object({
  doctorSlug: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'slotDate must be YYYY-MM-DD'),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, 'slotTime must be HH:MM'),
  consultationType: z.enum(['online', 'in_person', 'follow_up']),
  chiefComplaint: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
});

// ─── POST /bookings — create appointment (patient auth required) ──────────────

bookingRouter.post(
  '/',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res) => {
    const parsed = CreateBookingSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    // Look up patientId from userId
    const patientRow = await db.queryOne<{ id: string }>(
      'SELECT id FROM patients WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!patientRow) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient profile not found.' } });
    }

    try {
      const result = await BookingsService.createBooking({
        patientId: patientRow.id,
        ...parsed.data,
      });

      return res.status(result.success ? 201 : 400).json(result);
    } catch (err: any) {
      console.error('[CREATE_BOOKING_ERROR]', err);
      return res.status(500).json({ success: false, message: 'Failed to create booking.' });
    }
  }
);

// ─── POST /bookings/:id/confirm — patient confirms UPI payment ────────────────

bookingRouter.post(
  '/:id/confirm',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res) => {
    const { utrNumber } = req.body as { utrNumber?: string };

    const patientRow = await db.queryOne<{ id: string }>(
      'SELECT id FROM patients WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!patientRow) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient profile not found.' } });
    }

    try {
      const result = await BookingsService.confirmPayment(req.params.id, patientRow.id, utrNumber);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error('[CONFIRM_PAYMENT_ERROR]', err);
      return res.status(500).json({ success: false, message: 'Failed to confirm payment.' });
    }
  }
);

// ─── GET /bookings/my — patient's own appointments ───────────────────────────

bookingRouter.get(
  '/my',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res) => {
    const patientRow = await db.queryOne<{ id: string }>(
      'SELECT id FROM patients WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!patientRow) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found.' } });
    }
    const appointments = await BookingsService.getMyAppointments(patientRow.id);
    return res.json({ success: true, data: appointments });
  }
);

// ─── GET /bookings/:id — single appointment detail ───────────────────────────

bookingRouter.get(
  '/:id',
  requireAuth,
  async (req: AuthRequest, res) => {
    const appt = await BookingsService.getById(req.params.id);
    if (!appt) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found.' } });
    }
    return res.json({ success: true, data: appt });
  }
);

// ─── PUT /bookings/:id/cancel — cancel appointment ────────────────────────────

bookingRouter.put(
  '/:id/cancel',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const result = await BookingsService.cancelAppointment(req.params.id, req.user!.userId, req.user!.role);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error('[CANCEL_BOOKING_ERROR]', err);
      return res.status(500).json({ success: false, message: 'Failed to cancel appointment.' });
    }
  }
);

// ─── PUT /bookings/:id/reschedule — patient reschedules appointment ───────────

const RescheduleSchema = z.object({
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'slotDate must be YYYY-MM-DD'),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, 'slotTime must be HH:MM'),
});

bookingRouter.put(
  '/:id/reschedule',
  requireAuth,
  requireRole('PATIENT'),
  async (req: AuthRequest, res) => {
    const parsed = RescheduleSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const patientRow = await db.queryOne<{ id: string }>(
      'SELECT id FROM patients WHERE user_id = $1',
      [req.user!.userId]
    );
    if (!patientRow) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient profile not found.' } });
    }

    try {
      const result = await BookingsService.rescheduleAppointment(
        req.params.id,
        patientRow.id,
        parsed.data.slotDate,
        parsed.data.slotTime
      );
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
      console.error('[RESCHEDULE_BOOKING_ERROR]', err);
      return res.status(500).json({ success: false, message: 'Failed to reschedule appointment.' });
    }
  }
);
