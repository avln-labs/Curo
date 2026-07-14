/**
 * Patient Service — real PostgreSQL implementation
 */

import { db } from '../shared/database';
import type { PatientOnboardingData, UpdatePatientProfileData } from './schema';

const CONTACT_CHANGE_COOLDOWN_DAYS = 14;

interface PatientRow {
  id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string[];
  onboarding_complete: boolean;
  gender_locked: boolean;
  age_locked: boolean;
  created_at: string;
  updated_at: string;
}

interface UserRow {
  mobile: string;
  email: string | null;
  email_changed_at: string | null;
  mobile_changed_at: string | null;
}

export const PatientService = {

  /** Get patient profile by userId (authenticated patient) */
  async getByUserId(userId: string) {
    const patient = await db.queryOne<PatientRow & UserRow>(
      `SELECT p.*, u.mobile, u.email, u.email_changed_at, u.mobile_changed_at
       FROM patients p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );
    return patient;
  },

  /** Get patient profile by patientId (doctor lookup) */
  async getById(patientId: string) {
    const patient = await db.queryOne<PatientRow & UserRow>(
      `SELECT p.*, u.mobile, u.email, u.email_changed_at, u.mobile_changed_at
       FROM patients p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [patientId]
    );
    return patient;
  },

  /** Get a patient's health thread (appointments + prescriptions + documents) */
  async getHealthThread(patientId: string) {
    const { rows: appointments } = await db.query(
      `SELECT
         a.id, a.slot_date, a.slot_time, a.status, a.chief_complaint,
         a.consultation_started_at, a.consultation_ended_at, a.meet_link,
         d.full_name as doctor_name, d.slug as doctor_slug,
         ct.type as consultation_type, ct.fee
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN consultation_types ct ON ct.id = a.consultation_type_id
       WHERE a.patient_id = $1
       ORDER BY a.slot_date DESC, a.slot_time DESC`,
      [patientId]
    );

    const { rows: prescriptions } = await db.query(
      `SELECT
         px.id, px.serial_number, px.diagnosis, px.created_at,
         px.followup_date, px.verify_token,
         d.full_name as doctor_name,
         COALESCE(
           (SELECT json_agg(
              json_build_object(
                'drugName', pm.drug_name,
                'dose', pm.dose,
                'frequency', pm.frequency,
                'duration', pm.duration
              )
            )
            FROM prescription_medications pm
            WHERE pm.prescription_id = px.id), '[]'::json
         ) as medications
       FROM prescriptions px
       JOIN doctors d ON d.id = px.doctor_id
       WHERE px.patient_id = $1
       ORDER BY px.created_at DESC`,
      [patientId]
    );

    const { rows: documents } = await db.query(
      `SELECT id, original_name, mime_type, file_size_bytes, uploaded_at, appointment_id
       FROM documents
       WHERE patient_id = $1 AND is_deleted = false
       ORDER BY uploaded_at DESC`,
      [patientId]
    );

    return { appointments, prescriptions, documents };
  },

  /**
   * Initial patient onboarding — saves name, gender, dateOfBirth.
   * Sets onboarding_complete = true, gender_locked = true, age_locked = true.
   * Can only be called once (subsequent calls return an error if already complete).
   */
  async completeOnboarding(userId: string, data: PatientOnboardingData) {
    const existing = await db.queryOne<{ id: string; onboarding_complete: boolean }>(
      `SELECT id, onboarding_complete FROM patients WHERE user_id = $1`,
      [userId]
    );

    if (!existing) {
      return { success: false, message: 'Patient profile not found.' };
    }

    if (existing.onboarding_complete) {
      return { success: false, message: 'Profile has already been set up.' };
    }

    // Save name, gender, dateOfBirth and lock gender/age for future updates
    await db.query(
      `UPDATE patients
       SET full_name          = $1,
           gender             = $2,
           date_of_birth      = $3::date,
           onboarding_complete = true,
           gender_locked      = true,
           age_locked         = true,
           updated_at         = NOW()
       WHERE id = $4`,
      [data.fullName.trim(), data.gender, data.dateOfBirth, existing.id]
    );

    // Also update the user's name/display in the users record (fullName tracking)
    await db.query(
      `UPDATE users SET updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    return {
      success: true,
      message: 'Profile set up successfully.',
      profile: { fullName: data.fullName, gender: data.gender, dateOfBirth: data.dateOfBirth },
    };
  },

  /**
   * Update patient profile after onboarding.
   * Enforces:
   *   - gender: can only be changed if NOT gender_locked (i.e., not yet set)
   *   - age: can only be changed if NOT age_locked
   *   - email: can only change once every 14 days
   */
  async updateProfile(patientId: string, userId: string, data: UpdatePatientProfileData) {
    // Load current locks + timestamps
    const current = await db.queryOne<{
      gender_locked: boolean;
      age_locked: boolean;
    }>(
      `SELECT gender_locked, age_locked FROM patients WHERE id = $1`,
      [patientId]
    );

    if (!current) {
      return { success: false, message: 'Patient not found.' };
    }

    const userRow = await db.queryOne<{ email_changed_at: string | null }>(
      `SELECT email_changed_at FROM users WHERE id = $1`,
      [userId]
    );

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    const errors: string[] = [];

    if (data.fullName !== undefined) {
      updates.push(`full_name = $${idx++}`);
      params.push(data.fullName);
    }

    if (data.dateOfBirth !== undefined) {
      if (current.age_locked) {
        errors.push('Date of Birth can only be updated once after initial profile setup.');
      } else {
        updates.push(`date_of_birth = $${idx++}::date`);
        params.push(data.dateOfBirth);
        updates.push(`age_locked = true`);
      }
    }

    if (data.gender !== undefined) {
      if (current.gender_locked) {
        errors.push('Gender can only be updated once after initial profile setup.');
      } else {
        updates.push(`gender = $${idx++}`);
        params.push(data.gender);
        updates.push(`gender_locked = true`);
      }
    }

    if (data.bloodGroup !== undefined) {
      updates.push(`blood_group = $${idx++}`);
      params.push(data.bloodGroup);
    }

    if (data.allergies !== undefined) {
      updates.push(`allergies = $${idx++}`);
      params.push(data.allergies);
    }

    if (errors.length > 0) {
      return { success: false, message: errors.join(' ') };
    }

    if (updates.length === 0 && !data.email) {
      return { success: false, message: 'No fields to update.' };
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(patientId);
      await db.query(
        `UPDATE patients SET ${updates.join(', ')} WHERE id = $${idx}`,
        params
      );
    }

    // Email update — 14-day cooldown
    if (data.email) {
      if (userRow?.email_changed_at) {
        const lastChanged = new Date(userRow.email_changed_at);
        const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < CONTACT_CHANGE_COOLDOWN_DAYS) {
          const daysLeft = Math.ceil(CONTACT_CHANGE_COOLDOWN_DAYS - daysSince);
          return {
            success: false,
            message: `Email can only be changed once every ${CONTACT_CHANGE_COOLDOWN_DAYS} days. Please wait ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}.`,
          };
        }
      }
      await db.query(
        `UPDATE users SET email = $1, email_changed_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [data.email, userId]
      );
    }

    return { success: true, message: 'Profile updated.' };
  },
};
