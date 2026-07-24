/**
 * Documents Routes
 *
 * POST   /api/v1/documents                      → Patient uploads records (multipart, field: "files")
 * GET    /api/v1/documents/mine                 → Patient lists own documents
 * GET    /api/v1/documents/patient/:patientId   → Doctor lists a patient's documents
 * GET    /api/v1/documents/:id/download         → Stream file (owner patient / treating doctor)
 * DELETE /api/v1/documents/:id                  → Patient soft-deletes own document
 */

import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';
import { db } from '../shared/database';
import { DocumentsRepository } from './repository';
import {
  DocumentsService,
  isAllowedFile,
  makeStorageKey,
  uploadDir,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
} from './service';
import { toDto } from './types';

export const documentRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir()),
  filename: (_req, file, cb) => cb(null, makeStorageKey(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_UPLOAD },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFile(file.originalname, file.mimetype)) return cb(null, true);
    cb(new Error('UNSUPPORTED_FILE_TYPE'));
  },
});

async function getPatientId(userId: string): Promise<string | null> {
  const row = await db.queryOne<{ id: string }>('SELECT id FROM patients WHERE user_id = $1', [userId]);
  return row?.id ?? null;
}

// ─── POST /documents — upload ────────────────────────────────────────────────

documentRouter.post(
  '/',
  requireAuth,
  requireRole('PATIENT'),
  (req: AuthRequest, res) => {
    upload.array('files', MAX_FILES_PER_UPLOAD)(req, res, async (err: unknown) => {
      if (err) {
        const message =
          (err as Error).message === 'UNSUPPORTED_FILE_TYPE'
            ? 'Unsupported file type. Allowed: PDF, JPG, PNG, HEIC, DOC, DOCX.'
            : (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
              ? 'File too large. Maximum size is 10 MB per file.'
              : 'File could not be processed. Please try again.';
        return res.status(400).json({ success: false, error: { code: 'UPLOAD_REJECTED', message } });
      }

      try {
        const files = (req.files as Express.Multer.File[]) || [];
        if (files.length === 0) {
          return res.status(400).json({ success: false, error: { message: 'No files provided.' } });
        }

        const patientId = await getPatientId(req.user!.userId);
        if (!patientId) return res.status(404).json({ success: false, error: { message: 'Patient profile not found.' } });

        // Optional appointment link — must belong to this patient.
        let appointmentId: string | null = null;
        const requested = typeof req.body.appointmentId === 'string' ? req.body.appointmentId.trim() : '';
        if (requested) {
          const appt = await db.queryOne<{ id: string }>(
            'SELECT id FROM appointments WHERE id = $1 AND patient_id = $2',
            [requested, patientId]
          );
          if (!appt) return res.status(403).json({ success: false, error: { message: 'Appointment not found or not yours.' } });
          const existing = await DocumentsRepository.countForAppointment(appt.id);
          if (existing + files.length > MAX_FILES_PER_UPLOAD) {
            return res.status(400).json({ success: false, error: { message: `Maximum ${MAX_FILES_PER_UPLOAD} files per booking.` } });
          }
          appointmentId = appt.id;
        }

        const saved = await DocumentsService.saveUploadedFiles({ patientId, appointmentId, files });
        return res.status(201).json({ success: true, data: saved });
      } catch (e) {
        console.error('[documents] upload failed:', e);
        return res.status(500).json({ success: false, error: { message: 'File could not be processed. Please try again.' } });
      }
    });
  }
);

// ─── GET /documents/mine ─────────────────────────────────────────────────────

documentRouter.get('/mine', requireAuth, requireRole('PATIENT'), async (req: AuthRequest, res) => {
  const patientId = await getPatientId(req.user!.userId);
  if (!patientId) return res.status(404).json({ success: false, error: { message: 'Patient profile not found.' } });
  const data = await DocumentsService.listForPatient(patientId);
  return res.json({ success: true, data });
});

// ─── GET /documents/patient/:patientId — doctor view ─────────────────────────

documentRouter.get(
  '/patient/:patientId',
  requireAuth,
  requireRole('DOCTOR'),
  async (req: AuthRequest, res) => {
    try {
      const doctor = await db.queryOne<{ id: string }>('SELECT id FROM doctors WHERE user_id = $1', [req.user!.userId]);
      if (!doctor) return res.status(404).json({ success: false, error: { message: 'Doctor not found.' } });

      const related = await DocumentsRepository.doctorHasRelationship(doctor.id, req.params.patientId);
      if (!related) return res.status(403).json({ success: false, error: { message: 'No treatment relationship with this patient.' } });

      const data = await DocumentsService.listForPatient(req.params.patientId);
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('[DocumentsRoute] Error in GET /patient/:patientId:', err);
      return res.status(500).json({ success: false, error: { message: 'Internal server error.' } });
    }
  }
);

// ─── GET /documents/:id/download ─────────────────────────────────────────────

documentRouter.get('/:id/download', requireAuth, async (req: AuthRequest, res) => {
  try {
    const doc = await DocumentsRepository.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: { message: 'Document not found.' } });

    const allowed = await DocumentsService.authorizeAccess(doc, req.user!);
    if (!allowed) return res.status(403).json({ success: false, error: { message: 'Not authorized to access this document.' } });

    const filePath = DocumentsService.resolveFilePath(doc.storage_key);
    if (!filePath) return res.status(410).json({ success: false, error: { message: 'File is no longer available.' } });

    const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(doc.original_name)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(filePath);
  } catch (err: any) {
    console.error('[DocumentsRoute] Error in GET /:id/download:', err);
    return res.status(500).json({ success: false, error: { message: 'Internal server error.' } });
  }
});

// ─── DELETE /documents/:id ───────────────────────────────────────────────────

documentRouter.delete('/:id', requireAuth, requireRole('PATIENT'), async (req: AuthRequest, res) => {
  const patientId = await getPatientId(req.user!.userId);
  if (!patientId) return res.status(404).json({ success: false, error: { message: 'Patient profile not found.' } });

  const ok = await DocumentsService.remove(req.params.id, patientId);
  if (!ok) return res.status(404).json({ success: false, error: { message: 'Document not found or not yours.' } });
  return res.json({ success: true, message: 'Document deleted.' });
});
