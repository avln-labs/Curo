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

const CONSULT_TYPES = [
  { id: 'online',     label: 'Online Consultation',    fee: '₹500', duration: '15 min', desc: 'Video call with Dr. Sharma' },
  { id: 'in_person',  label: 'In-person Consultation', fee: '₹700', duration: '20 min', desc: 'Visit Sharma Clinic, Pune' },
  { id: 'follow_up',  label: 'Follow-up',              fee: '₹300', duration: '10 min', desc: 'For existing patients only' },
];

const DURATION_UNITS = ['Days', 'Weeks', 'Months'];

export function BookingSymptoms() {
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState('');
  const [description, setDescription] = useState('');
  const [durValue, setDurValue] = useState('3');
  const [durUnit, setDurUnit] = useState('Days');
  const [consultType, setConsultType] = useState('');

  function next() {
    save({ complaint, description, duration: `${durValue} ${durUnit}`, consultType });
    navigate('/booking/slot');
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
        <BookingSteps current={2} />
        <h2 style={{ marginBottom: 4 }}>Tell the doctor why you're visiting</h2>
        <p className="text-sm text-muted" style={{ marginBottom: 24 }}>This helps the doctor prepare before your appointment.</p>

        <div className="form-group">
          <label className="form-label">Chief complaint <span style={{ color: 'var(--error)' }}>*</span></label>
          <input
            className="input"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value.slice(0, 200))}
            placeholder="e.g. Recurring fever since 3 days"
          />
          <div className="form-hint">{complaint.length}/200 characters</div>
        </div>

        <div className="form-group">
          <label className="form-label">Description <span className="text-muted">(optional)</span></label>
          <textarea
            className="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            placeholder="Any additional details — when it started, what makes it worse, medications tried…"
          />
          <div className="form-hint">{description.length}/1000</div>
        </div>

        <div className="form-group">
          <label className="form-label">Duration <span style={{ color: 'var(--error)' }}>*</span></label>
          <div className="input-group">
            <input
              className="input"
              type="number"
              min={1}
              value={durValue}
              onChange={(e) => setDurValue(e.target.value)}
              style={{ width: 80, flex: 'unset' }}
            />
            <select className="select input" value={durUnit} onChange={(e) => setDurUnit(e.target.value)}>
              {DURATION_UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 80 }}>
          <label className="form-label">Consultation type <span style={{ color: 'var(--error)' }}>*</span></label>
          {CONSULT_TYPES.map((ct) => (
            <div
              key={ct.id}
              className={`consultation-type-option${consultType === ct.id ? ' selected' : ''}`}
              onClick={() => setConsultType(ct.id)}
            >
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ct.label}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>{ct.desc} · {ct.duration}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{ct.fee}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky-cta">
        <button className="btn btn-ghost" onClick={() => navigate('/booking/details')}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          style={{ flex: 1 }}
          onClick={next}
          disabled={!complaint || !durValue || !consultType}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
