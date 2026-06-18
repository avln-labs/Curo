/**
 * Patient Service — real PostgreSQL implementation
 */

import { db } from '../shared/database';
import type { UpdatePatientProfileData } from './schema';

interface PatientRow {
  id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string[];
  created_at: string;
  updated_at: string;
}

interface UserRow {
  mobile: string;
  email: string | null;
}

export const PatientService = {

  /** Get patient profile by userId (authenticated patient) */
  async getByUserId(userId: string) {
    const patient = await db.queryOne<PatientRow & UserRow>(
      `SELECT p.*, u.mobile, u.email
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
      `SELECT p.*, u.mobile, u.email
       FROM patients p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [patientId]
    );
    return patient;
  },

  /** Get a patient's health thread (appointments + prescriptions) */
  async getHealthThread(patientId: string) {
    const { rows: appointments } = await db.query(
      `SELECT
         a.id, a.slot_date, a.slot_time, a.status, a.chief_complaint,
         a.consultation_started_at, a.consultation_ended_at,
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
         d.full_name as doctor_name
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

  /** Update patient profile */
  async updateProfile(patientId: string, userId: string, data: UpdatePatientProfileData) {
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined) { updates.push(`full_name = $${idx++}`); params.push(data.fullName); }
    if (data.age !== undefined) { updates.push(`age = $${idx++}`); params.push(data.age); }
    if (data.gender !== undefined) { updates.push(`gender = $${idx++}`); params.push(data.gender); }
    if (data.bloodGroup !== undefined) { updates.push(`blood_group = $${idx++}`); params.push(data.bloodGroup); }
    if (data.allergies !== undefined) { updates.push(`allergies = $${idx++}`); params.push(data.allergies); }

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

    if (data.email) {
      await db.query(
        `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
        [data.email, userId]
      );
    }

    return { success: true, message: 'Profile updated.' };
  },
};
