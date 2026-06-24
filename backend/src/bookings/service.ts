/**
 * Bookings Service
 *
 * Handles appointment creation, retrieval, and lifecycle.
 * Payment confirmation is handled by the payments module.
 */

import { db } from '../shared/database';

interface CreateBookingData {
  patientId: string;
  doctorSlug: string;
  slotDate: string;   // YYYY-MM-DD
  slotTime: string;   // HH:MM
  consultationType: 'online' | 'in_person' | 'follow_up';
  chiefComplaint: string;
  description?: string;
}

export const BookingsService = {

  /** Create appointment in payment_pending state, hold slot for 10 minutes */
  async createBooking(data: CreateBookingData) {
    // Look up doctor
    const doctor = await db.queryOne<{
      id: string;
      full_name: string;
      slug: string;
      upi_id: string | null;
      upi_qr_url: string | null;
      booking_link_active: boolean;
    }>(
      `SELECT id, full_name, slug, upi_id, upi_qr_url, booking_link_active
       FROM doctors WHERE slug = $1 AND is_active = true`,
      [data.doctorSlug]
    );
    if (!doctor) return { success: false, message: 'Doctor not found.' };
    if (!doctor.booking_link_active) {
      return { success: false, message: 'This doctor is not accepting bookings at the moment.' };
    }

    // Look up consultation type + fee
    const ct = await db.queryOne<{ id: string; fee: string; duration_minutes: number }>(
      `SELECT id, fee, duration_minutes FROM consultation_types
       WHERE doctor_id = $1 AND type = $2 AND is_active = true LIMIT 1`,
      [doctor.id, data.consultationType]
    );
    if (!ct) return { success: false, message: 'Consultation type not available.' };

    // Check slot is still free (double-check before creating)
    const existing = await db.queryOne(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND slot_date = $2::date AND slot_time = $3::time
         AND status NOT IN ('cancelled', 'no_show')
         AND (slot_held_until IS NULL OR slot_held_until > NOW())`,
      [doctor.id, data.slotDate, data.slotTime]
    );
    if (existing) return { success: false, message: 'This slot has just been booked. Please select another.' };

    // Generate appointment code
    const code = `APT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const holdUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const row = await db.queryOne<{ id: string }>(
      `INSERT INTO appointments (
         doctor_id, patient_id,
         consultation_type_id,
         status,
         slot_date, slot_time, slot_held_until,
         chief_complaint, complaint_description
       ) VALUES ($1, $2, $3, 'payment_pending',
                 $4::date, $5::time, $6::timestamptz, $7, $8)
       ON CONFLICT (doctor_id, slot_date, slot_time)
       DO UPDATE SET
         patient_id = EXCLUDED.patient_id,
         consultation_type_id = EXCLUDED.consultation_type_id,
         status = 'payment_pending',
         slot_held_until = EXCLUDED.slot_held_until,
         chief_complaint = EXCLUDED.chief_complaint,
         complaint_description = EXCLUDED.complaint_description,
         updated_at = NOW()
       RETURNING id`,
      [
        doctor.id, data.patientId,
        ct.id,
        data.slotDate, data.slotTime, holdUntil,
        data.chiefComplaint, data.description ?? null,
      ]
    );

    return {
      success: true,
      appointment: {
        id: row!.id,
        doctorName: doctor.full_name,
        slotDate: data.slotDate,
        slotTime: data.slotTime,
        consultationType: data.consultationType,
        fee: parseFloat(ct.fee),
        upiId: doctor.upi_id,
        upiQrUrl: doctor.upi_qr_url,
        slotHeldUntil: holdUntil,
      },
    };
  },

  /** Mark appointment as confirmed after manual UPI payment signal from patient */
  async confirmPayment(appointmentId: string, patientId: string, utrNumber?: string) {
    const appt = await db.queryOne<{ id: string; patient_id: string; status: string }>(
      `SELECT id, patient_id, status FROM appointments WHERE id = $1`,
      [appointmentId]
    );
    if (!appt) return { success: false, message: 'Appointment not found.' };
    if (appt.patient_id !== patientId) return { success: false, message: 'Not authorized.' };
    if (appt.status !== 'payment_pending') {
      return { success: false, message: `Appointment is already ${appt.status}.` };
    }

    // Record payment row
    const doctorRow = await db.queryOne<{ doctor_id: string; fee: string; ct_id: string }>(
      `SELECT a.doctor_id, ct.fee, ct.id as ct_id
       FROM appointments a
       JOIN consultation_types ct ON ct.id = a.consultation_type_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (doctorRow) {
      await db.query(
        `INSERT INTO payments (appointment_id, razorpay_order_id, amount, currency, status, metadata)
         VALUES ($1, $2, $3, 'INR', 'captured', $4)`,
        [
          appointmentId,
          `upi_${appointmentId}_${Date.now()}`,
          Math.round(parseFloat(doctorRow.fee)),
          JSON.stringify({ utrNumber: utrNumber ?? null, method: 'upi_manual' }),
        ]
      );
    }

    await db.query(
      `UPDATE appointments SET status = 'confirmed', slot_held_until = NULL, updated_at = NOW() WHERE id = $1`,
      [appointmentId]
    );

    return { success: true, message: 'Appointment confirmed.' };
  },

  /** Get a patient's own appointments */
  async getMyAppointments(patientId: string) {
    const { rows } = await db.query(
      `SELECT
         a.id, a.status, a.slot_date, a.slot_time,
         a.chief_complaint, ct.type as consultation_type, a.meet_link,
         a.created_at,
         d.full_name as doctor_name, d.slug as doctor_slug,
         d.specialisations, d.city,
         ct.fee,
         p.id as prescription_id
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       LEFT JOIN consultation_types ct ON ct.id = a.consultation_type_id
       LEFT JOIN prescriptions p ON p.appointment_id = a.id
       WHERE a.patient_id = $1
       ORDER BY a.slot_date DESC, a.slot_time DESC`,
      [patientId]
    );
    return rows;
  },

  /** Get a single appointment by ID */
  async getById(appointmentId: string) {
    return db.queryOne(
      `SELECT
         a.id, a.status, a.slot_date, a.slot_time,
         a.chief_complaint, a.complaint_description as description, ct.type as consultation_type, a.meet_link,
         a.slot_held_until, a.created_at, a.updated_at,
         d.full_name as doctor_name, d.slug as doctor_slug,
         d.upi_id, d.upi_qr_url,
         d.specialisations, d.city,
         ct.fee,
         pat.full_name as patient_name, pat.date_of_birth, pat.gender
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN patients pat ON pat.id = a.patient_id
       LEFT JOIN consultation_types ct ON ct.id = a.consultation_type_id
       WHERE a.id = $1`,
      [appointmentId]
    );
  },
};
