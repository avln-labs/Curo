/**
 * Doctor Service — real PostgreSQL implementation
 *
 * Covers:
 *   - Onboarding wizard (4 steps)
 *   - Profile read/update
 *   - Dashboard data
 *   - Schedule management
 *   - Public profile for booking page
 */

import crypto from 'crypto';
import { db } from '../shared/database';
import { verifyDoctorRegistration } from './verification';
import type {
  OnboardingProfileData,
  OnboardingFeesData,
  OnboardingScheduleData,
  UpdateDoctorProfileData,
  BlockDatesData,
} from './schema';

// ─── DB Row Types ─────────────────────────────────────────────────────────────

interface DoctorRow {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  profile_photo_url: string | null;
  qualifications: string[];
  specialisations: string[];
  registration_number: string | null;
  registration_council: string | null;
  clinic_name: string | null;
  city: string | null;
  bio: string | null;
  languages: string[];
  verification_status: string;
  is_active: boolean;
  booking_link_active: boolean;
  onboarding_step: number;
  average_rating: string;
  review_count: number;
  created_at: string;
  updated_at: string;
}

interface ConsultationTypeRow {
  id: string;
  doctor_id: string;
  type: string;
  fee: string;
  duration_minutes: number;
  is_active: boolean;
}

interface ScheduleRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface SettingsRow {
  buffer_minutes: number;
  max_patients_per_day: number;
  min_booking_advance_minutes: number;
  cancellation_window_hours: number;
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function nameToSlugBase(name: string): string {
  return 'dr-' + name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);
}

async function ensureUniqueSlug(base: string, excludeDoctorId?: string): Promise<string> {
  let candidate = base;
  let attempt = 0;

  while (true) {
    const params: unknown[] = [candidate];
    let sql = 'SELECT id FROM doctors WHERE slug = $1';
    if (excludeDoctorId) {
      sql += ' AND id != $2';
      params.push(excludeDoctorId);
    }

    const row = await db.queryOne(sql, params);
    if (!row) return candidate;  // available

    attempt++;
    const suffix = crypto.randomBytes(2).toString('hex');
    candidate = `${base}-${suffix}`.slice(0, 40);
    if (attempt > 10) throw new Error('Could not generate a unique slug. Please choose a custom one.');
  }
}

// ─── Doctor Service ───────────────────────────────────────────────────────────

export const DoctorService = {

  /** Get a doctor's full profile by their user_id (authenticated) */
  async getByUserId(userId: string) {
    const doctor = await db.queryOne<DoctorRow>(
      `SELECT d.*, u.email
       FROM doctors d
       JOIN users u ON u.id = d.user_id
       WHERE d.user_id = $1`,
      [userId]
    );
    if (!doctor) return null;

    const consultationTypes = await db.query<ConsultationTypeRow>(
      'SELECT * FROM consultation_types WHERE doctor_id = $1 ORDER BY type',
      [doctor.id]
    );

    const settings = await db.queryOne<SettingsRow>(
      'SELECT * FROM doctor_settings WHERE doctor_id = $1',
      [doctor.id]
    );

    return { ...doctor, consultationTypes: consultationTypes.rows, settings };
  },

  /** Get a doctor's profile by ID */
  async getById(doctorId: string) {
    return db.queryOne<DoctorRow>(
      'SELECT * FROM doctors WHERE id = $1',
      [doctorId]
    );
  },

  /**
   * Onboarding Step 1: Save clinic profile details
   * Sets verification_status = 'pending', triggers format validation
   */
  async saveOnboardingProfile(doctorId: string, userId: string, data: OnboardingProfileData) {
    // Determine slug
    let slug: string;
    if (data.slug) {
      // Custom slug requested — check uniqueness
      const existing = await db.queryOne(
        'SELECT id FROM doctors WHERE slug = $1 AND id != $2',
        [data.slug, doctorId]
      );
      if (existing) {
        return { success: false, message: 'This URL slug is already taken. Please choose another.' };
      }
      slug = data.slug;
    } else {
      const base = nameToSlugBase(data.fullName);
      slug = await ensureUniqueSlug(base, doctorId);
    }

    // Verify registration number format (+ queue for manual review)
    const verificationResult = await verifyDoctorRegistration(
      data.registrationNumber,
      data.registrationCouncil
    );

    if (!verificationResult.isValid) {
      return {
        success: false,
        message: 'Registration number format is invalid. Please check and try again.',
      };
    }

    // Update doctor profile
    await db.query(
      `UPDATE doctors SET
         slug = $1,
         full_name = $2,
         qualifications = $3,
         specialisations = $4,
         registration_number = $5,
         registration_council = $6,
         clinic_name = $7,
         city = $8,
         bio = $9,
         languages = $10,
         verification_status = 'pending',
         onboarding_step = GREATEST(onboarding_step, 1),
         updated_at = NOW()
       WHERE id = $11`,
      [
        slug,
        data.fullName,
        data.qualifications,
        data.specialisations,
        data.registrationNumber,
        data.registrationCouncil,
        data.clinicName ?? null,
        data.city,
        data.bio ?? null,
        data.languages,
        doctorId,
      ]
    );

    // Update email on users table if provided
    if (data.email) {
      await db.query(
        `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
        [data.email, userId]
      );
    }

    // Log verification history
    await db.query(
      `INSERT INTO doctor_verification_history (doctor_id, action, note)
       VALUES ($1, 'submitted', $2)`,
      [doctorId, verificationResult.requiresManualReview ? 'Queued for manual admin review' : 'Auto-verified']
    );

    const updatedDoctor = await db.queryOne<DoctorRow>(
      'SELECT id, slug, full_name, onboarding_step, verification_status FROM doctors WHERE id = $1',
      [doctorId]
    );

    return {
      success: true,
      message: 'Profile saved. Awaiting verification.',
      doctor: updatedDoctor,
      bookingUrl: `curo.app/${updatedDoctor?.slug}`,
    };
  },

  /**
   * Onboarding Step 2: Save consultation fees/types
   */
  async saveOnboardingFees(doctorId: string, data: OnboardingFeesData) {
    for (const ct of data.consultationTypes) {
      await db.query(
        `INSERT INTO consultation_types (doctor_id, type, fee, duration_minutes, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (doctor_id, type) DO UPDATE SET
           fee = EXCLUDED.fee,
           duration_minutes = EXCLUDED.duration_minutes,
           is_active = EXCLUDED.is_active,
           updated_at = NOW()`,
        [doctorId, ct.type, ct.fee, ct.durationMinutes, ct.isActive]
      );
    }

    await db.query(
      `UPDATE doctors SET onboarding_step = GREATEST(onboarding_step, 2), updated_at = NOW()
       WHERE id = $1`,
      [doctorId]
    );

    return { success: true, message: 'Consultation fees saved.' };
  },

  /**
   * Onboarding Step 3: Save weekly schedule
   */
  async saveOnboardingSchedule(doctorId: string, data: OnboardingScheduleData) {
    await db.transaction(async (client) => {
      // Upsert each day
      for (const day of data.schedule) {
        const { rows: existingRows } = await client.query(
          'SELECT id FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2',
          [doctorId, day.dayOfWeek]
        );

        let scheduleId: string;

        if (existingRows.length > 0) {
          scheduleId = existingRows[0].id;
          await client.query(
            `UPDATE doctor_schedules SET start_time = $1, end_time = $2, is_active = $3 WHERE id = $4`,
            [day.startTime, day.endTime, day.isActive, scheduleId]
          );
          await client.query('DELETE FROM doctor_schedule_breaks WHERE schedule_id = $1', [scheduleId]);
        } else {
          const { rows } = await client.query(
            `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [doctorId, day.dayOfWeek, day.startTime, day.endTime, day.isActive]
          );
          scheduleId = rows[0].id;
        }

        // Insert breaks
        for (const brk of day.breaks) {
          await client.query(
            `INSERT INTO doctor_schedule_breaks (schedule_id, start_time, end_time) VALUES ($1, $2, $3)`,
            [scheduleId, brk.startTime, brk.endTime]
          );
        }
      }

      // Upsert settings
      await client.query(
        `INSERT INTO doctor_settings (doctor_id, buffer_minutes, max_patients_per_day, min_booking_advance_minutes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (doctor_id) DO UPDATE SET
           buffer_minutes = EXCLUDED.buffer_minutes,
           max_patients_per_day = EXCLUDED.max_patients_per_day,
           min_booking_advance_minutes = EXCLUDED.min_booking_advance_minutes,
           updated_at = NOW()`,
        [doctorId, data.bufferMinutes, data.maxPatientsPerDay, data.minBookingAdvanceMinutes]
      );

      await client.query(
        `UPDATE doctors SET onboarding_step = GREATEST(onboarding_step, 3), updated_at = NOW()
         WHERE id = $1`,
        [doctorId]
      );
    });

    return { success: true, message: 'Schedule saved.' };
  },

  /**
   * Mark onboarding as complete (Step 4 — payment setup done externally via Razorpay)
   * Called after Razorpay linked account onboarding webhook.
   */
  async markOnboardingComplete(doctorId: string) {
    await db.query(
      `UPDATE doctors SET
         onboarding_step = 4,
         booking_link_active = (verification_status = 'verified'),
         updated_at = NOW()
       WHERE id = $1`,
      [doctorId]
    );
    return { success: true, message: 'Onboarding complete.' };
  },

  /** Update doctor profile fields post-onboarding */
  async updateProfile(doctorId: string, userId: string, data: UpdateDoctorProfileData) {
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined) { updates.push(`full_name = $${idx++}`); params.push(data.fullName); }
    if (data.clinicName !== undefined) { updates.push(`clinic_name = $${idx++}`); params.push(data.clinicName); }
    if (data.city !== undefined) { updates.push(`city = $${idx++}`); params.push(data.city); }
    if (data.bio !== undefined) { updates.push(`bio = $${idx++}`); params.push(data.bio); }
    if (data.languages !== undefined) { updates.push(`languages = $${idx++}`); params.push(data.languages); }
    if (data.qualifications !== undefined) { updates.push(`qualifications = $${idx++}`); params.push(data.qualifications); }
    if (data.specialisations !== undefined) { updates.push(`specialisations = $${idx++}`); params.push(data.specialisations); }

    if (updates.length === 0 && !data.email) {
      return { success: false, message: 'No fields to update.' };
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(doctorId);
      await db.query(
        `UPDATE doctors SET ${updates.join(', ')} WHERE id = $${idx}`,
        params
      );
    }

    if (data.email) {
      await db.query(
        `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
        [data.email, userId]
      );
    }

    return { success: true, message: 'Profile updated.' };
  },

  /** Get dashboard data for the doctor (today's stats + appointments + slots) */
  async getDashboard(doctorId: string) {
    const today = new Date().toISOString().split('T')[0];

    // Today's appointment stats
    const { rows: statsRows } = await db.query<{
      total: string;
      confirmed: string;
      completed: string;
      pending_payment: string;
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'payment_pending') as pending_payment
       FROM appointments
       WHERE doctor_id = $1 AND slot_date = $2`,
      [doctorId, today]
    );

    const stats = statsRows[0] ?? { total: '0', confirmed: '0', completed: '0', pending_payment: '0' };

    // Today's appointments with patient info
    const { rows: appointments } = await db.query(
      `SELECT
         a.id, a.slot_time, a.status, a.chief_complaint, a.consultation_started_at,
         p.full_name as patient_name, p.age, p.gender,
         ct.type as consultation_type, ct.fee
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN consultation_types ct ON ct.id = a.consultation_type_id
       WHERE a.doctor_id = $1 AND a.slot_date = $2
       ORDER BY a.slot_time`,
      [doctorId, today]
    );

    // Total collected today (confirmed + completed)
    const { rows: revenueRows } = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(ct.fee), 0) as total
       FROM appointments a
       JOIN consultation_types ct ON ct.id = a.consultation_type_id
       WHERE a.doctor_id = $1 AND a.slot_date = $2
         AND a.status IN ('confirmed','in_progress','completed')`,
      [doctorId, today]
    );

    const collectedAmount = parseFloat(revenueRows[0]?.total ?? '0');

    // Get doctor info
    const doctor = await db.queryOne<{ slug: string; booking_link_active: boolean }>(
      'SELECT slug, booking_link_active FROM doctors WHERE id = $1',
      [doctorId]
    );

    return {
      date: today,
      stats: {
        totalAppointments: parseInt(stats.total),
        confirmed: parseInt(stats.confirmed),
        completed: parseInt(stats.completed),
        pendingPayment: parseInt(stats.pending_payment),
        collectedAmount,
      },
      appointments,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nextAppointment: (appointments as any[]).find((a) => a.status === 'confirmed') ?? null,
      bookingUrl: doctor ? `curo.app/${doctor.slug}` : null,
    };
  },

  /** Get public doctor profile (for booking page — no auth required) */
  async getPublicProfile(slug: string) {
    const doctor = await db.queryOne<DoctorRow>(
      `SELECT id, slug, full_name, qualifications, specialisations, city, bio,
              languages, average_rating, review_count, verification_status, booking_link_active
       FROM doctors WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (!doctor) return null;

    const { rows: consultationTypes } = await db.query<ConsultationTypeRow>(
      'SELECT type, fee, duration_minutes, is_active FROM consultation_types WHERE doctor_id = $1 AND is_active = true',
      [doctor.id]
    );

    return {
      ...doctor,
      consultationTypes,
    };
  },

  /** Get doctor's weekly schedule */
  async getSchedule(doctorId: string) {
    const { rows: schedule } = await db.query<ScheduleRow>(
      'SELECT id, day_of_week, start_time, end_time, is_active FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week',
      [doctorId]
    );

    const { rows: blockedDates } = await db.query(
      'SELECT blocked_date, reason FROM doctor_blocked_dates WHERE doctor_id = $1 ORDER BY blocked_date',
      [doctorId]
    );

    const settings = await db.queryOne<SettingsRow>(
      'SELECT * FROM doctor_settings WHERE doctor_id = $1',
      [doctorId]
    );

    return { schedule, blockedDates, settings };
  },

  /** Block specific dates */
  async blockDates(doctorId: string, data: BlockDatesData) {
    for (const date of data.dates) {
      await db.query(
        `INSERT INTO doctor_blocked_dates (doctor_id, blocked_date, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (doctor_id, blocked_date) DO UPDATE SET reason = EXCLUDED.reason`,
        [doctorId, date, data.reason ?? null]
      );
    }
    return { success: true, message: `${data.dates.length} date(s) blocked.` };
  },

  /** Unblock specific dates */
  async unblockDates(doctorId: string, dates: string[]) {
    await db.query(
      `DELETE FROM doctor_blocked_dates WHERE doctor_id = $1 AND blocked_date = ANY($2::date[])`,
      [doctorId, dates]
    );
    return { success: true, message: `${dates.length} date(s) unblocked.` };
  },
};
