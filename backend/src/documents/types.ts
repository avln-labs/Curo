export interface DocumentRow {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  original_name: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface DocumentDto {
  id: string;
  appointmentId: string | null;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export function toDto(row: DocumentRow): DocumentDto {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    uploadedAt: row.uploaded_at,
  };
}
