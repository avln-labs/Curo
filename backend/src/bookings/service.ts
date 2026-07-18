/**
 * Bookings Service
 *
 * Handles appointment creation, retrieval, and lifecycle.
 * Payment confirmation is handled by the payments module.
 */

import { db } from '../shared/database';
import { NotificationService } from '../shared/notifications';
import { getVisibleMeetLink } from '../shared/utils/meetLogic';

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

    // Check if consultation type is online and doctor has google_refresh_token
    const apptData = await db.queryOne<{
      doctor_id: string;
      doctor_name: string;
      patient_name: string;
      slot_date: any;
      slot_time: string;
      chief_complaint: string;
      consultation_type: string;
      google_refresh_token: string | null;
      patient_mobile: string;
      patient_email: string | null;
      doctor_mobile: string;
      doctor_email: string | null;
    }>(
      `SELECT
         a.doctor_id, a.slot_date, a.slot_time, a.chief_complaint,
         d.full_name as doctor_name, d.google_refresh_token,
         pat.full_name as patient_name,
         ct.type as consultation_type,
         u_pat.mobile as patient_mobile, u_pat.email as patient_email,
         u_doc.mobile as doctor_mobile, u_doc.email as doctor_email
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN patients pat ON pat.id = a.patient_id
       JOIN users u_pat ON u_pat.id = pat.user_id
       JOIN users u_doc ON u_doc.id = d.user_id
       LEFT JOIN consultation_types ct ON ct.id = a.consultation_type_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    let meetLink: string | null = null;
    let calendarEventId: string | null = null;

    if (apptData && apptData.consultation_type === 'online' && apptData.google_refresh_token) {
      try {
        const { GoogleCalendarService } = await import('../doctors/google');
        const meetRes = await GoogleCalendarService.createMeetEvent(apptData.google_refresh_token, {
          id: appointmentId,
          doctorName: apptData.doctor_name,
          patientName: apptData.patient_name,
          slotDate: typeof apptData.slot_date === 'object' ? apptData.slot_date.toISOString().split('T')[0] : apptData.slot_date,
          slotTime: apptData.slot_time,
          chiefComplaint: apptData.chief_complaint,
          doctorEmail: apptData.doctor_email,
          patientEmail: apptData.patient_email,
        });
        meetLink = meetRes.meetLink;
        calendarEventId = meetRes.calendarEventId;
      } catch (err: any) {
        console.error('[CREATE_MEET_EVENT_ERROR]', err);
        // Fail gracefully, allow appointment confirmation to succeed
      }
    }

    await db.query(
      `UPDATE appointments SET status = 'confirmed', slot_held_until = NULL, meet_link = COALESCE($2, meet_link), calendar_event_id = COALESCE($3, calendar_event_id), updated_at = NOW() WHERE id = $1`,
      [appointmentId, meetLink, calendarEventId]
    );

    if (apptData) {
      const formatTime12H = (tStr: string) => {
        if (!tStr) return '';
        const [hStr, mStr] = tStr.split(':');
        const h = parseInt(hStr, 10);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${mStr.slice(0, 2)} ${suffix}`;
      };

      const formattedDate = new Date(apptData.slot_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
      const formattedTime = formatTime12H(apptData.slot_time);

      // Notify Patient
      NotificationService.sendSms(
        apptData.patient_mobile, 
        `Your appointment with Dr. ${apptData.doctor_name} is confirmed for ${formattedDate} at ${formattedTime}.`
      );
      if (apptData.patient_email) {
        NotificationService.sendEmail(
          apptData.patient_email,
          'Appointment Confirmed',
          `Your appointment with Dr. ${apptData.doctor_name} is confirmed for ${formattedDate} at ${formattedTime}.`
        );
      }

      // Notify Doctor
      NotificationService.sendSms(
        apptData.doctor_mobile,
        `New Appointment: ${apptData.patient_name} has booked an appointment for ${formattedDate} at ${formattedTime}.`
      );
      if (apptData.doctor_email) {
        NotificationService.sendEmail(
          apptData.doctor_email,
          'New Appointment Booked',
          `${apptData.patient_name} has booked an appointment for ${formattedDate} at ${formattedTime}. Complaint: ${apptData.chief_complaint}`
        );
      }
    }

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
    return rows.map(r => ({ ...r, meet_link: getVisibleMeetLink(r.meet_link, r.slot_date, r.slot_time) }));
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
    if (appt) {
      appt.meet_link = getVisibleMeetLink(appt.meet_link, appt.slot_date, appt.slot_time);
    }
    return appt;
  },

  /** Cancel an appointment */
  async cancelAppointment(appointmentId: string, userId: string, userRole: string) {
    const appt = await db.queryOne<{
      id: string;
      patient_id: string;
      doctor_id: string;
      status: string;
      calendar_event_id: string | null;
      google_refresh_token: string | null;
    }>(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status, a.calendar_event_id, d.google_refresh_token
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (!appt) return { success: false, message: 'Appointment not found.' };

    // Verify ownership
    if (userRole === 'PATIENT') {
      const p = await db.queryOne<{ id: string }>('SELECT id FROM patients WHERE user_id = $1', [userId]);
      if (p?.id !== appt.patient_id) return { success: false, message: 'Not authorized.' };
    } else if (userRole === 'DOCTOR') {
      const d = await db.queryOne<{ id: string }>('SELECT id FROM doctors WHERE user_id = $1', [userId]);
      if (d?.id !== appt.doctor_id) return { success: false, message: 'Not authorized.' };
    } else {
      return { success: false, message: 'Not authorized.' };
    }

    if (appt.status === 'cancelled') return { success: false, message: 'Already cancelled.' };
    if (appt.status === 'completed') return { success: false, message: 'Cannot cancel a completed appointment.' };

    await db.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [appointmentId]
    );

    if (appt.calendar_event_id && appt.google_refresh_token) {
      try {
        const { GoogleCalendarService } = await import('../doctors/google');
        await GoogleCalendarService.deleteEvent(appt.google_refresh_token, appt.calendar_event_id);
      } catch (err) {
        console.error('[CANCEL_MEET_EVENT_ERROR]', err);
      }
    }

    return { success: true, message: 'Appointment cancelled successfully.' };
  },

  /** Reschedule an appointment */
  async rescheduleAppointment(appointmentId: string, patientId: string, newDate: string, newTime: string) {
    const appt = await db.queryOne<{
      id: string;
      patient_id: string;
      doctor_id: string;
      status: string;
      calendar_event_id: string | null;
      google_refresh_token: string | null;
    }>(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status, a.calendar_event_id, d.google_refresh_token
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (!appt) return { success: false, message: 'Appointment not found.' };
    if (appt.patient_id !== patientId) return { success: false, message: 'Not authorized.' };
    if (appt.status !== 'confirmed') return { success: false, message: 'Can only reschedule confirmed appointments.' };

    // Check slot is still free
    const existing = await db.queryOne(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND slot_date = $2::date AND slot_time = $3::time
         AND status NOT IN ('cancelled', 'no_show')
         AND (slot_held_until IS NULL OR slot_held_until > NOW())`,
      [appt.doctor_id, newDate, newTime]
    );
    if (existing) return { success: false, message: 'The selected slot is already booked.' };

    await db.query(
      `UPDATE appointments SET slot_date = $1::date, slot_time = $2::time, updated_at = NOW() WHERE id = $3`,
      [newDate, newTime, appointmentId]
    );

    if (appt.calendar_event_id && appt.google_refresh_token) {
      try {
        const { GoogleCalendarService } = await import('../doctors/google');
        await GoogleCalendarService.updateEvent(appt.google_refresh_token, appt.calendar_event_id, {
          slotDate: newDate,
          slotTime: newTime,
        });
      } catch (err) {
        console.error('[UPDATE_MEET_EVENT_ERROR]', err);
      }
    }

    return { success: true, message: 'Appointment rescheduled successfully.' };
  },
};
