import { Link } from 'react-router-dom';

/**
 * HealthThreadPage
 *
 * Patient health threads (longitudinal AI memory per patient) will be populated
 * once the booking engine (Phase 3) is live and patients start booking consultations.
 *
 * For now, shows a proper empty state.
 */
export function HealthThreadPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Patient Health Threads</h1>
        <p className="page-subtitle">Longitudinal memory for every patient — the core value of CURO</p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
        <h2 style={{ marginBottom: 8 }}>No patient threads yet</h2>
        <p className="text-muted text-sm" style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          Each patient who books a consultation through your Curo link will get their own
          longitudinal health thread here — with consultation notes, prescriptions, lab reports,
          and an AI memory summary built over time.
          <br /><br />
          Complete your profile setup first, then share your booking link to start accepting patients.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/doctor-onboarding" className="btn btn-primary">Complete Setup →</Link>
          <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2 className="card-title">What's in a health thread</h2>
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { icon: '🧠', title: 'AI Memory', desc: 'A running AI summary of the patient\'s history, updated after every visit' },
            { icon: '📅', title: 'Consultation Timeline', desc: 'Chronological notes, diagnoses, and prescriptions from all visits' },
            { icon: '🔬', title: 'Reports & Uploads', desc: 'Lab reports and scans uploaded by the patient or your clinic' },
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
