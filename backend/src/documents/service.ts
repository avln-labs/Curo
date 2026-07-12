/**
 * Documents Service
 *
 * Handles secure storage of patient medical records (previous reports,
 * scans, referral letters) on local disk for the MVP.
 *
 * Security model:
 * - Only authenticated PATIENTs can upload; files are always owned by the
 *   uploading patient (patient_id derived from the JWT, never the body).
 * - Strict allow-list of file types (extension + MIME double check).
 * - Files stored under a random UUID key — original names never touch disk,
 *   which eliminates path-traversal and collision issues.
 * - Doctors can only read documents of patients they have an appointment with.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../shared/database';
import { env } from '../shared/env';
import { DocumentsRepository } from './repository';
import { toDto, type DocumentRow } from './types';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (PRD §6)
export const MAX_FILES_PER_UPLOAD = 5;               // PRD §6: 5 files per booking

/** Allowed types: extension → acceptable MIME types */
export const ALLOWED_TYPES: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.heic': ['image/heic', 'image/heif'],
  '.doc':  ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export function isAllowedFile(originalName: string, mimeType: string): boolean {
  const ext = path.extname(originalName).toLowerCase();
  const mimes = ALLOWED_TYPES[ext];
  return !!mimes && mimes.includes(mimeType.toLowerCase());
}

export function uploadDir(): string {
  const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Random, extension-preserving storage key. Never derived from user input. */
export function makeStorageKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  return `${crypto.randomUUID()}${ext}`;
}

export const DocumentsService = {
  async saveUploadedFiles(params: {
    patientId: string;
    appointmentId: string | null;
    files: Array<{ originalname: string; filename: string; mimetype: string; size: number }>;
  }) {
    const saved = [];
    for (const f of params.files) {
      const row = await DocumentsRepository.insert({
        patientId: params.patientId,
        appointmentId: params.appointmentId,
        originalName: sanitizeDisplayName(f.originalname),
        storageKey: f.filename,
        mimeType: f.mimetype,
        fileSizeBytes: f.size,
      });
      saved.push(toDto(row));
    }
    return saved;
  },

  async listForPatient(patientId: string) {
    const rows = await DocumentsRepository.listByPatient(patientId);
    return rows.map(toDto);
  },

  /**
   * Authorize read access:
   * - Patient may read their own documents.
   * - Doctor may read documents of patients they share an appointment with.
   */
  async authorizeAccess(doc: DocumentRow, user: { userId: string; role: string }): Promise<boolean> {
    if (user.role === 'PATIENT') {
      const patient = await db.queryOne<{ id: string }>(
        'SELECT id FROM patients WHERE user_id = $1', [user.userId]
      );
      return !!patient && patient.id === doc.patient_id;
    }
    if (user.role === 'DOCTOR') {
      const doctor = await db.queryOne<{ id: string }>(
        'SELECT id FROM doctors WHERE user_id = $1', [user.userId]
      );
      if (!doctor) return false;
      return DocumentsRepository.doctorHasRelationship(doctor.id, doc.patient_id);
    }
    return user.role === 'ADMIN';
  },

  resolveFilePath(storageKey: string): string | null {
    // Defense in depth: keys are UUID-based, but re-validate no traversal.
    const safe = path.basename(storageKey);
    const full = path.join(uploadDir(), safe);
    return fs.existsSync(full) ? full : null;
  },

  async remove(id: string, patientId: string): Promise<boolean> {
    const doc = await DocumentsRepository.findById(id);
    if (!doc || doc.patient_id !== patientId) return false;
    const ok = await DocumentsRepository.softDelete(id, patientId);
    // Keep the file on disk (soft delete) — recoverable, auditable. MVP choice.
    return ok;
  },
};

function sanitizeDisplayName(name: string): string {
  // Strip any path segments and control characters from the display name.
  return path.basename(name).replace(/[\u0000-\u001F<>:"/\\|?*]/g, '_').slice(0, 255);
}
