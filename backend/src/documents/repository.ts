import { db } from '../shared/database';
import type { DocumentRow } from './types';

export const DocumentsRepository = {
  async insert(doc: {
    patientId: string;
    appointmentId: string | null;
    originalName: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
  }): Promise<DocumentRow> {
    const row = await db.queryOne<DocumentRow>(
      `INSERT INTO documents
         (patient_id, appointment_id, original_name, storage_key, mime_type, file_size_bytes, virus_scan_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'clean')
       RETURNING id, patient_id, appointment_id, original_name, storage_key, mime_type, file_size_bytes, uploaded_at`,
      [doc.patientId, doc.appointmentId, doc.originalName, doc.storageKey, doc.mimeType, doc.fileSizeBytes]
    );
    return row!;
  },

  async findById(id: string): Promise<DocumentRow | null> {
    return db.queryOne<DocumentRow>(
      `SELECT id, patient_id, appointment_id, original_name, storage_key, mime_type, file_size_bytes, uploaded_at
       FROM documents WHERE id = $1 AND is_deleted = false`,
      [id]
    );
  },

  async listByPatient(patientId: string): Promise<DocumentRow[]> {
    const { rows } = await db.query<DocumentRow>(
      `SELECT id, patient_id, appointment_id, original_name, storage_key, mime_type, file_size_bytes, uploaded_at
       FROM documents WHERE patient_id = $1 AND is_deleted = false
       ORDER BY uploaded_at DESC`,
      [patientId]
    );
    return rows;
  },

  async countForAppointment(appointmentId: string): Promise<number> {
    const row = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM documents WHERE appointment_id = $1 AND is_deleted = false`,
      [appointmentId]
    );
    return parseInt(row?.count ?? '0', 10);
  },

  async softDelete(id: string, patientId: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE documents SET is_deleted = true WHERE id = $1 AND patient_id = $2 AND is_deleted = false`,
      [id, patientId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  /** True when the doctor has (or had) at least one appointment with this patient. */
  async doctorHasRelationship(doctorId: string, patientId: string): Promise<boolean> {
    const row = await db.queryOne(
      `SELECT 1 FROM appointments WHERE doctor_id = $1 AND patient_id = $2 LIMIT 1`,
      [doctorId, patientId]
    );
    return !!row;
  },
};
