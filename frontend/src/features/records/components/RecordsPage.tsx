import { Link } from 'react-router-dom';

/**
 * RecordsPage
 *
 * Health records (consultations, prescriptions, uploaded reports) will be
 * fetched from the patient health thread API once the booking engine (Phase 3)
 * is live. For now, shows a proper empty state with feature preview.
 */
export function RecordsPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Health Records</h1>
        <p className="page-subtitle">Past consultations · prescriptions · uploaded reports · share links</p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ marginBottom: 8 }}>No records yet</h2>
        <p className="text-muted text-sm" style={{ maxWidth: 440, margin: '0 auto 24px' }}>
          Your health thread — including consultation notes, prescriptions, and uploaded lab
          reports — will appear here once you've had a confirmed consultation through Curo.
          <br /><br />
          Records can be shared with any clinic via a secure, time-limited link.
        </p>
        <Link to="/booking/details" className="btn btn-primary">Book a Consultation</Link>
      </div>

      {/* Feature preview */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Coming in your health thread</h2>
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { icon: '🩺', title: 'Consultation History', desc: 'Every visit, doctor notes, and diagnosis in chronological order' },
            { icon: '💊', title: 'Prescriptions', desc: 'Digital Rx with medications, download as PDF or resend via WhatsApp' },
            { icon: '🔗', title: 'Secure Sharing', desc: 'Generate a single-use, time-limited link to share records with any clinic' },
          ].map((f) => (
            <div key={f.title} style={{ padding: 16, background: 'var(--surface-raised)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.875rem' }}>{f.title}</div>
              <div className="text-xs text-muted">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
