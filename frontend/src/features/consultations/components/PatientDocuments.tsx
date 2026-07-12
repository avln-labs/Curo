/**
 * PatientDocuments — doctor-side list of a patient's uploaded records,
 * with authenticated inline preview / download.
 */

import { useEffect, useState } from 'react';
import { documentsApi, type PatientDocument } from '../../../shared/api';
import { FileIcon } from '../../../shared/components/FileIcon';

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function PatientDocuments({ patientId }: { patientId: string }) {
  const [docs, setDocs] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    documentsApi.listForPatient(patientId).then((res) => {
      if (!cancelled) {
        setDocs(res.data?.data ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [patientId]);

  async function openDoc(doc: PatientDocument) {
    setBusyId(doc.id);
    const { url } = await documentsApi.getFileUrl(doc.id, true);
    setBusyId('');
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (loading) {
    return (
      <div className="skeleton-group">
        <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        <div className="skeleton skeleton-line" style={{ width: '55%' }} />
      </div>
    );
  }

  if (docs.length === 0) {
    return <div className="text-muted text-sm">No records uploaded by this patient.</div>;
  }

  return (
    <ul className="doc-list">
      {docs.map((d) => (
        <li key={d.id} className="doc-item">
          <FileIcon mimeType={d.mimeType} name={d.originalName} size={30} />
          <div className="doc-item-body">
            <div className="doc-item-name" title={d.originalName}>{d.originalName}</div>
            <div className="doc-item-meta">
              {new Date(d.uploadedAt).toLocaleDateString('en-IN')} · {formatSize(d.fileSizeBytes)}
            </div>
          </div>
          <button
            className={`btn btn-ghost btn-sm${busyId === d.id ? ' loading' : ''}`}
            onClick={() => openDoc(d)}
            disabled={busyId === d.id}
          >
            View
          </button>
        </li>
      ))}
    </ul>
  );
}
