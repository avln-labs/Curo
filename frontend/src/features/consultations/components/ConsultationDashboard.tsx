import { Link } from 'react-router-dom';

/**
 * ConsultationDashboard
 *
 * Active consultation sessions will be fetched here once the booking engine
 * (Phase 3) is live. For now, shows a proper empty state.
 *
 * The prescription builder and AI pre-consult summary remain fully interactive
 * but are gated behind a real appointment being selected.
 */
export function ConsultationDashboard() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Consultation Workspace</h1>
        <p className="page-subtitle">Active sessions — patient snapshot · notes · prescription builder</p>
      </div>

      {/* Empty state */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <h2 style={{ marginBottom: 8 }}>No active consultations</h2>
        <p className="text-muted text-sm" style={{ maxWidth: 420, margin: '0 auto 24px' }}>
          Confirmed appointments will appear here with a full patient snapshot, AI pre-consult
          summary, consultation notes editor, and prescription builder.
          <br /><br />
          Booking & appointment management is coming in Phase 3.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          <Link to="/doctor-onboarding" className="btn btn-secondary">Complete Setup →</Link>
        </div>
      </div>

      {/* Feature preview */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2 className="card-title">What you'll see here</h2>
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { icon: '👤', title: 'Patient Snapshot', desc: 'Blood group, allergies, past prescriptions, uploaded reports' },
            { icon: '✦', title: 'AI Pre-Consult Brief', desc: 'Summarises patient history and current symptoms before you begin' },
            { icon: '📋', title: 'Prescription Builder', desc: 'Issue Rx with medications, investigations, follow-up — send via WhatsApp' },
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
