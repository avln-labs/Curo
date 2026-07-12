/**
 * RecordUpload — drag & drop / tap-to-browse uploader for previous medical
 * records (PDF, JPG/PNG/HEIC, DOC/DOCX · max 10MB · up to 5 at a time).
 *
 * Client-side validation mirrors the backend allow-list so most errors are
 * caught before any network call.
 */

import { useRef, useState } from 'react';
import { documentsApi } from '../../../shared/api';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.heic,.doc,.docx';
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'doc', 'docx'];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

function validate(files: File[]): string | null {
  if (files.length === 0) return 'No files selected.';
  if (files.length > MAX_FILES) return `You can upload up to ${MAX_FILES} files at a time.`;
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.includes(ext)) return `"${f.name}" is not supported. Allowed: PDF, JPG, PNG, HEIC, DOC, DOCX.`;
    if (f.size > MAX_SIZE) return `"${f.name}" is larger than 10 MB.`;
    if (f.size === 0) return `"${f.name}" appears to be empty.`;
  }
  return null;
}

interface Props {
  appointmentId?: string;
  onUploaded: () => void;
}

export function RecordUpload({ appointmentId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    setError('');
    setSuccess('');

    const validationError = validate(files);
    if (validationError) return setError(validationError);

    setUploading(true);
    const res = await documentsApi.upload(files, appointmentId);
    setUploading(false);

    if (res.data?.success) {
      setSuccess(`${files.length} file${files.length > 1 ? 's' : ''} uploaded securely.`);
      onUploaded();
    } else {
      setError(res.error || 'Upload failed. Please try again.');
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div
        className={`dropzone${dragging ? ' dropzone-active' : ''}${uploading ? ' dropzone-busy' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload medical records"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-icon" aria-hidden="true">
          {uploading ? '⏳' : '⬆'}
        </div>
        <div className="dropzone-title">
          {uploading ? 'Uploading…' : dragging ? 'Drop files to upload' : 'Upload previous medical records'}
        </div>
        <div className="dropzone-hint">
          Drag &amp; drop or tap to browse · PDF, JPG, PNG, HEIC, DOC, DOCX · max 10 MB each · up to {MAX_FILES} files
        </div>
      </div>

      {error && <div className="upload-message upload-error" role="alert">{error}</div>}
      {success && <div className="upload-message upload-success" role="status">✓ {success}</div>}
    </div>
  );
}
