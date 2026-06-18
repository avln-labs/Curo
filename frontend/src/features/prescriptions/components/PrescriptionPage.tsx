import { Link } from 'react-router-dom';

/**
 * PrescriptionPage
 *
 * Digital prescriptions will be issued here from within an active consultation
 * session (Phase 3). The prescription builder is tied to a confirmed appointment
 * and patient record.
 *
 * For now, shows a clean empty state with feature preview.
 */
export function PrescriptionPage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Prescriptions</h1>
        <p className="page-subtitle">Issue digital prescriptions · Send via WhatsApp · Saved to patient health thread</p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <h2 style={{ marginBottom: 8 }}>No prescriptions yet</h2>
        <p className="text-muted text-sm" style={{ maxWidth: 440, margin: '0 auto 24px' }}>
          Prescriptions are issued from inside an active consultation session.
          Once a patient books a consultation and it begins, you'll be able to issue
          a digital Rx here — with medications, investigations, advice, and follow-up date.
          <br /><br />
          It will be sent to the patient via WhatsApp and saved to their health thread automatically.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/consultations" className="btn btn-primary">Consultation Workspace</Link>
          <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Prescription builder — coming in Phase 3</h2>
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { icon: '💊', title: 'Medication Table', desc: 'Drug · dose · frequency · duration · instructions in structured format' },
            { icon: '📱', title: 'WhatsApp Delivery', desc: "Sent instantly to the patient's registered mobile number" },
            { icon: '🔗', title: 'Verify QR Code', desc: 'Every prescription has a unique verification URL and QR code' },
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
