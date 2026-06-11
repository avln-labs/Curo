import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function BookingConfirmation() {
  const [conf, setConf] = useState<any>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('curo.confirmation') || 'null');
    setConf(data);
  }, []);

  if (!conf) return (
    <div className="booking-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="text-muted">Loading confirmation…</p>
    </div>
  );

  const TIMELINE_STEPS = [
    { label: 'Payment received', desc: `₹${conf.amount} captured via UPI`, done: true },
    { label: 'Slot confirmed', desc: `${conf.date} at ${conf.slot} with ${conf.doctor}`, done: true },
    { label: 'Documents shared', desc: 'Uploaded reports sent to doctor', done: true },
    { label: 'Reminder scheduled', desc: 'WhatsApp reminder 30 min before slot', done: true },
  ];

  return (
    <div className="booking-shell">
      <div className="booking-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo">C</div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CURO</span>
        </div>
      </div>

      <div className="booking-container">
        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ marginBottom: 6 }}>Booking confirmed!</h2>
          <p className="text-sm text-muted">You'll receive a WhatsApp confirmation shortly.</p>
        </div>

        {/* Booking ID */}
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-3) var(--space-4)',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Booking ID</div>
          <div className="mono" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>
            {conf.bookingId}
          </div>
        </div>

        {/* Booking details */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 24 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Appointment details</div>
          {[
            { label: 'Patient', value: conf.patientName },
            { label: 'Doctor', value: conf.doctor },
            { label: 'Date', value: conf.date },
            { label: 'Time', value: conf.slot },
            { label: 'Complaint', value: conf.complaint },
            { label: 'Type', value: conf.consultType === 'online' ? 'Online (Video)' : conf.consultType === 'in_person' ? 'In-person' : 'Online' },
          ].map((row) => (
            <div key={row.label} className="flex-between" style={{ fontSize: '0.875rem', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="text-muted">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Confirmation timeline */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>What happened</div>
          <div className="confirm-timeline">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={i} className="confirm-step">
                <div className="confirm-dot">✓</div>
                <div className="confirm-text">
                  <strong>{step.label}</strong>
                  <span>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp notice */}
        <div className="notice notice-success" style={{ marginBottom: 24 }}>
          WhatsApp confirmation sent to your registered mobile. For online consult, your join link will arrive 30 minutes before.
        </div>

        {/* Share */}
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-3)',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <p className="text-sm" style={{ marginBottom: 10 }}>Know someone who needs a doctor?</p>
          <div className="mono text-xs text-muted" style={{ marginBottom: 10 }}>curo.app/dr-arun-sharma</div>
          <button className="btn btn-secondary btn-sm">Share booking link</button>
        </div>

        <Link to="/" className="btn btn-primary btn-full btn-lg">Back to home →</Link>
      </div>
    </div>
  );
}
