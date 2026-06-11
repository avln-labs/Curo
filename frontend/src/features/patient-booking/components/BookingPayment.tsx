import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function save(data: Record<string, unknown>) {
  const prev = JSON.parse(localStorage.getItem('curo.booking') || '{}');
  localStorage.setItem('curo.booking', JSON.stringify({ ...prev, ...data }));
}

function BookingSteps({ current }: { current: number }) {
  const steps = ['Your Details', 'Symptoms', 'Select Slot', 'Payment'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === current;
        const isDone = n < current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: n < steps.length ? 1 : 'unset' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--surface-raised)',
                color: isDone || isActive ? 'white' : 'var(--text-tertiary)',
                border: `2px solid ${isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-strong)'}`,
              }}>
                {isDone ? '✓' : n}
              </div>
              {n <= current && (
                <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {label}
                </span>
              )}
            </div>
            {n < steps.length && (
              <div style={{ flex: 1, height: 1, background: isDone ? 'var(--success)' : 'var(--border)', margin: '0 10px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

type UploadedFile = { name: string; size: string };

export function BookingPayment() {
  const navigate = useNavigate();
  const data = JSON.parse(localStorage.getItem('curo.booking') || '{}');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [paying, setPaying] = useState(false);

  const FEE = 500;
  const PLATFORM_FEE = 13;
  const TOTAL = FEE + PLATFORM_FEE;

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).slice(0, 5 - files.length);
    const newFiles: UploadedFile[] = dropped.map((f) => ({ name: f.name, size: `${(f.size / 1024).toFixed(0)} KB` }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(i: number) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); }

  function pay() {
    setPaying(true);
    const conf = {
      bookingId: `BKG-${Math.floor(Math.random() * 90000) + 10000}`,
      patientName: data.patientName || 'Patient',
      date: data.date || '2026-06-10',
      slot: data.slot || '10:00',
      doctor: 'Dr. Arun Sharma',
      complaint: data.complaint || 'Consultation',
      consultType: data.consultType || 'Online',
      amount: TOTAL,
    };
    localStorage.setItem('curo.confirmation', JSON.stringify(conf));
    setTimeout(() => navigate('/booking/confirmation'), 1000);
  }

  return (
    <div className="booking-shell">
      <div className="booking-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo">C</div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CURO</span>
        </div>
        <span className="text-sm text-muted">Book with Dr. Arun Sharma</span>
      </div>

      <div className="booking-container">
        <BookingSteps current={4} />
        <h2 style={{ marginBottom: 4 }}>Documents & Payment</h2>
        <p className="text-sm text-muted" style={{ marginBottom: 24 }}>Upload any relevant reports (optional). Then pay to confirm your slot.</p>

        {/* Booking summary */}
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Booking summary</div>
          {[
            { label: 'Doctor', value: 'Dr. Arun Sharma' },
            { label: 'Date', value: data.date || '2026-06-10' },
            { label: 'Time', value: data.slot || '10:00' },
            { label: 'Complaint', value: data.complaint || 'Consultation' },
            { label: 'Type', value: data.consultType === 'online' ? 'Online (Video)' : 'In-person' },
          ].map((row) => (
            <div key={row.label} className="flex-between" style={{ fontSize: '0.875rem', padding: '4px 0' }}>
              <span className="text-muted">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Document upload */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Upload reports <span className="text-muted">(optional — max 5 files, 10MB each)</span></label>
          <div
            className="upload-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <div className="upload-zone-icon">📄</div>
            <div className="text-sm font-medium">Drag & drop files here</div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>PDF, JPEG, PNG, HEIC accepted</div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => {
                if (files.length < 5) {
                  setFiles((prev) => [...prev, { name: `Report_${Date.now()}.pdf`, size: '245 KB' }]);
                }
              }}
            >
              Browse files
            </button>
          </div>
          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <span style={{ fontSize: '1rem' }}>📄</span>
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <span className="text-xs text-muted">{f.size}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFile(i)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fee breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Fee breakdown</div>
          {[
            { label: 'Consultation fee', value: `₹${FEE}` },
            { label: 'Platform convenience fee', value: `₹${PLATFORM_FEE}` },
          ].map((row) => (
            <div key={row.label} className="flex-between" style={{ fontSize: '0.875rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="text-muted">{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
          <div className="flex-between" style={{ padding: '10px 0 0', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>₹{TOTAL}</span>
          </div>
        </div>

        <div className="notice notice-info" style={{ marginBottom: 80 }}>
          Free cancellation up to 2 hours before your slot. 50% refund after that. No refund for no-show.
        </div>
      </div>

      <div className="sticky-cta">
        <button className="btn btn-ghost" onClick={() => navigate('/booking/slot')}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          style={{ flex: 1 }}
          onClick={pay}
          disabled={paying}
        >
          {paying ? 'Processing…' : `Pay ₹${TOTAL} →`}
        </button>
      </div>
    </div>
  );
}
