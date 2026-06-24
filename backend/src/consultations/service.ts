/**
 * Consultations Service
 *
 * Manages the appointment lifecycle from the doctor's perspective:
 * - Get today's appointments (UPCOMING / LIVE / COMPLETED)
 * - Start consultation (LIVE state)
 * - Complete consultation (COMPLETED — blocked unless prescription exists)
 * - Set meet link
 */

import { db } from '../shared/database';

export const ConsultationsService = {

  /** Get today's appointments for a doctor, grouped by status */
  async getTodaysAppointments(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { rows } = await db.query(
      `SELECT
         a.id, a.status, a.slot_date, a.slot_time,
         a.chief_complaint, a.complaint_description as description, ct.type as consultation_type, a.meet_link,
         a.created_at,
         p.full_name as patient_name, p.date_of_birth, p.gender,
         ct.fee, ct.duration_minutes,
         pr.id as prescription_id
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN consultation_types ct ON ct.id = a.consultation_type_id
       LEFT JOIN prescriptions pr ON pr.appointment_id = a.id
       WHERE a.doctor_id = $1 AND a.slot_date = $2
         AND a.status IN ('confirmed', 'in_progress', 'completed')
       ORDER BY a.slot_time ASC`,
      [doctorId, today]
    );

    return {
      today,
      upcoming:  rows.filter((r: any) => r.status === 'confirmed'),
      live:      rows.filter((r: any) => r.status === 'in_progress'),
      completed: rows.filter((r: any) => r.status === 'completed'),
    };
  },

  /** Get all past appointments for a doctor (not today) */
  async getPastAppointments(doctorId: string, limit = 50) {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await db.query(
      `SELECT
         a.id, a.status, a.slot_date, a.slot_time,
         a.chief_complaint, ct.type as consultation_type,
         p.full_name as patient_name, p.date_of_birth, p.gender,
         ct.fee,
         pr.id as prescription_id
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       LEFT JOIN consultation_types ct ON ct.id = a.consultation_type_id
       LEFT JOIN prescriptions pr ON pr.appointment_id = a.id
       WHERE a.doctor_id = $1 AND a.slot_date < $2
         AND a.status IN ('completed', 'cancelled', 'no_show')
       ORDER BY a.slot_date DESC, a.slot_time DESC
       LIMIT $3`,
      [doctorId, today, limit]
    );
    return rows;
  },

  /** Get single appointment detail (doctor view) */
  async getAppointment(appointmentId: string, doctorId: string) {
    return db.queryOne(
      `SELECT
         a.id, a.status, a.slot_date, a.slot_time,
         a.chief_complaint, a.complaint_description as description, ct.type as consultation_type, a.meet_link,
         p.id as patient_id, p.full_name as patient_name,
         p.date_of_birth, p.gender, p.blood_group, p.allergies,
         u.mobile as patient_mobile,
         ct.fee, ct.duration_minutes,
         pr.id as prescription_id
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users u ON u.id = p.user_id
       LEFT JOIN consultation_types ct ON ct.id = a.consultation_type_id
       LEFT JOIN prescriptions pr ON pr.appointment_id = a.id
       WHERE a.id = $1 AND a.doctor_id = $2`,
      [appointmentId, doctorId]
    );
  },

  /** Start consultation — sets status to in_progress */
  async startConsultation(appointmentId: string, doctorId: string, meetLink?: string) {
    const appt = await db.queryOne<{ id: string; status: string; doctor_id: string }>(
      `SELECT id, status, doctor_id FROM appointments WHERE id = $1`,
      [appointmentId]
    );
    if (!appt) return { success: false, message: 'Appointment not found.' };
    if (appt.doctor_id !== doctorId) return { success: false, message: 'Not your appointment.' };
    if (appt.status !== 'confirmed') {
      return { success: false, message: `Appointment is ${appt.status}, cannot start.` };
    }

    await db.query(
      `UPDATE appointments
       SET status = 'in_progress',
           meet_link = COALESCE($1, meet_link),
           updated_at = NOW()
       WHERE id = $2`,
      [meetLink ?? null, appointmentId]
    );

    // Create consultation session record
    await db.query(
      `INSERT INTO consultation_sessions (appointment_id, session_status, video_room_url, started_at)
       VALUES ($1, 'in_progress', $2, NOW())
       ON CONFLICT (appointment_id) DO UPDATE SET
         session_status = 'in_progress',
         video_room_url = COALESCE(EXCLUDED.video_room_url, consultation_sessions.video_room_url),
         started_at = NOW(),
         updated_at = NOW()`,
      [appointmentId, meetLink ?? null]
    );

    return { success: true, message: 'Consultation started.' };
  },

  /** Complete consultation — blocked if no prescription exists */
  async completeConsultation(appointmentId: string, doctorId: string) {
    const appt = await db.queryOne<{ id: string; status: string; doctor_id: string }>(
      `SELECT id, status, doctor_id FROM appointments WHERE id = $1`,
      [appointmentId]
    );
    if (!appt) return { success: false, message: 'Appointment not found.' };
    if (appt.doctor_id !== doctorId) return { success: false, message: 'Not your appointment.' };
    if (appt.status !== 'in_progress') {
      return { success: false, message: `Appointment is ${appt.status}, cannot complete.` };
    }

    // Block completion if no prescription exists
    const rx = await db.queryOne(
      `SELECT id FROM prescriptions WHERE appointment_id = $1`,
      [appointmentId]
    );
    if (!rx) {
      return {
        success: false,
        message: 'Cannot end consultation without a prescription. Please save the prescription first.',
        code: 'PRESCRIPTION_REQUIRED',
      };
    }

    await db.query(
      `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [appointmentId]
    );

    await db.query(
      `UPDATE consultation_sessions
       SET session_status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE appointment_id = $1`,
      [appointmentId]
    );

    return { success: true, message: 'Consultation completed.' };
  },

  /** Update meet link for an appointment */
  async setMeetLink(appointmentId: string, doctorId: string, meetLink: string) {
    const appt = await db.queryOne<{ doctor_id: string }>(
      `SELECT doctor_id FROM appointments WHERE id = $1`,
      [appointmentId]
    );
    if (!appt || appt.doctor_id !== doctorId) {
      return { success: false, message: 'Not authorized.' };
    }
    await db.query(
      `UPDATE appointments SET meet_link = $1, updated_at = NOW() WHERE id = $2`,
      [meetLink, appointmentId]
    );
    await db.query(
      `UPDATE consultation_sessions SET video_room_url = $1, updated_at = NOW()
       WHERE appointment_id = $2`,
      [meetLink, appointmentId]
    );
    return { success: true, message: 'Meet link saved.' };
  },
};
