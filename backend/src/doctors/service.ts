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

    // Update doctor profile
    await db.query(
      `UPDATE doctors SET
        slug = $1,
        full_name = $2,
        specialisations = $3,
        onboarding_step = GREATEST(onboarding_step, 1),
        verification_status = 'verified',
        updated_at = NOW()
       WHERE id = $4`,
      [
        slug,
        data.fullName,
        data.specialisations,
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
       VALUES ($1, 'approved', 'Auto-verified for MVP')`,
      [doctorId]
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

  /** Mark onboarding as complete — enables booking link for MVP (no admin gate) */
  async markOnboardingComplete(doctorId: string) {
    await db.query(
      `UPDATE doctors SET
         onboarding_step = 4,
         booking_link_active = true,
         updated_at = NOW()
       WHERE id = $1`,
      [doctorId]
    );
    return { success: true, message: 'Onboarding complete.' };
  },

  /** Save UPI payment info (upi_id + upi_qr_url) */
  async updateUpiInfo(doctorId: string, data: { upiId?: string; upiQrUrl?: string }) {
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (data.upiId !== undefined)    { updates.push(`upi_id = $${idx++}`);     params.push(data.upiId); }
    if (data.upiQrUrl !== undefined) { updates.push(`upi_qr_url = $${idx++}`); params.push(data.upiQrUrl); }
    if (updates.length === 0) return { success: false, message: 'Nothing to update.' };
    updates.push(`updated_at = NOW()`);
    params.push(doctorId);
    await db.query(`UPDATE doctors SET ${updates.join(', ')} WHERE id = $${idx}`, params);
    return { success: true, message: 'UPI info saved.' };
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
         p.full_name as patient_name, p.date_of_birth, p.gender,
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

  /**
   * Generate available slots for a doctor on a given date.
   * Reads doctor_schedules, excludes booked slots and blocked dates.
   * @param slug  doctor slug
   * @param date  YYYY-MM-DD
   */
  async getAvailableSlots(slug: string, date: string) {
    // Resolve doctor
    const doctor = await db.queryOne<{ id: string; slug: string; full_name: string }>(  
      `SELECT id, slug, full_name FROM doctors WHERE slug = $1 AND is_active = true`,
      [slug]
    );
    if (!doctor) return null;

    // Check if date is blocked
    const blocked = await db.queryOne(
      `SELECT id FROM doctor_blocked_dates WHERE doctor_id = $1 AND blocked_date = $2::date`,
      [doctor.id, date]
    );
    if (blocked) return { slots: [], blocked: true };

    // Get day of week (0=Sun)
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    // Get schedule for that day
    const schedule = await db.queryOne<{
      start_time: string;
      end_time: string;
      is_active: boolean;
    }>(
      `SELECT start_time, end_time, is_active FROM doctor_schedules
       WHERE doctor_id = $1 AND day_of_week = $2`,
      [doctor.id, dayOfWeek]
    );

    if (!schedule || !schedule.is_active) return { slots: [], blocked: false };

    // Get consultation type duration (use shortest active type as slot size)
    const ctRow = await db.queryOne<{ duration_minutes: number; fee: string }>(  
      `SELECT duration_minutes, fee FROM consultation_types
       WHERE doctor_id = $1 AND is_active = true ORDER BY duration_minutes ASC LIMIT 1`,
      [doctor.id]
    );
    const slotDuration = ctRow?.duration_minutes ?? 15;

    // Get breaks
    const { rows: breaks } = await db.query<{ start_time: string; end_time: string }>(
      `SELECT dsb.start_time, dsb.end_time
       FROM doctor_schedule_breaks dsb
       JOIN doctor_schedules ds ON ds.id = dsb.schedule_id
       WHERE ds.doctor_id = $1 AND ds.day_of_week = $2`,
      [doctor.id, dayOfWeek]
    );

    // Get already-booked slots for this date (non-cancelled)
    const { rows: booked } = await db.query<{ slot_time: string }>(
      `SELECT slot_time FROM appointments
       WHERE doctor_id = $1 AND slot_date = $2::date
         AND status NOT IN ('cancelled','no_show')
         AND (slot_held_until IS NULL OR slot_held_until > NOW())`,
      [doctor.id, date]
    );
    const bookedTimes = new Set(booked.map(r => r.slot_time.slice(0, 5)));

    // Generate slots
    function timeToMinutes(t: string): number {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }
    function minutesToTime(m: number): string {
      return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    }

    const startMin = timeToMinutes(schedule.start_time);
    const endMin = timeToMinutes(schedule.end_time);
    const breakRanges = breaks.map(b => ({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
    }));

    const slots: { time: string; available: boolean }[] = [];
    for (let t = startMin; t + slotDuration <= endMin; t += slotDuration) {
      const timeStr = minutesToTime(t);
      // Check if slot falls in a break
      const inBreak = breakRanges.some(br => t >= br.start && t < br.end);
      const isBooked = bookedTimes.has(timeStr);
      slots.push({ time: timeStr, available: !inBreak && !isBooked });
    }

    return { slots, blocked: false, slotDuration };
  },
};

