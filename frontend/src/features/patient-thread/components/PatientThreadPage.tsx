import { useParams, Link } from 'react-router-dom';

const PATIENT_DATA: Record<string, any> = {
  's1': {
    id: 's1',
    name: 'Rohan Kumar',
    initials: 'RK',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    phone: '+91 98765 43210',
    email: 'rohan.k@email.com',
    curoId: 'PAT-000142',
    aiMemory: 'Rohan is a 34-year-old male with a history of recurring fever episodes (3 documented). Responds well to Paracetamol + ORS. No serious underlying illness found. CBC and Dengue NS1 were negative in Nov 2024. Penicillin allergy documented. Last visit: Viral fever, resolved in 5 days.',
    aiSources: ['Consult · Jun 2026', 'Prescription · Apr 2025', 'Lab report · Nov 2024'],
    events: [
      {
        id: 'e1',
        date: '9 Jun 2026',
        type: 'consultation',
        title: 'Viral Fever — Acute',
        body: 'Fever 101°F · 3 days · mild headache · no respiratory symptoms. Paracetamol + ORS prescribed. Follow-up in 5 days.',
      },
      {
        id: 'e2',
        date: '7 Apr 2025',
        type: 'prescription',
        title: 'Rx: Paracetamol 500mg · ORS',
        body: 'For viral fever episode. 1-0-1 for 5 days. Sent via WhatsApp.',
      },
      {
        id: 'e3',
        date: '14 Nov 2024',
        type: 'report',
        title: 'Lab: CBC + Dengue NS1',
        body: 'CBC — within normal limits. Dengue NS1 — Negative. Platelet count normal.',
      },
      {
        id: 'e4',
        date: '11 Nov 2024',
        type: 'consultation',
        title: 'Fever Episode — Second Visit',
        body: 'Fever 100°F · 2 days · sent for CBC and Dengue panel. Paracetamol advised.',
      },
      {
        id: 'e5',
        date: '3 Mar 2024',
        type: 'followup',
        title: 'Follow-up: Gastrointestinal',
        body: 'Follow-up for gastritis. Pantoprazole continued. Dietary advice given. No further complaints.',
      },
    ],
  },
  'consult-1': {
    id: 'consult-1',
    name: 'Rohan Kumar',
    initials: 'RK',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    phone: '+91 98765 43210',
    email: 'rohan.k@email.com',
    curoId: 'PAT-000142',
    aiMemory: 'Rohan is a 34-year-old male with a history of recurring fever episodes (3 documented). Responds well to Paracetamol + ORS. No serious underlying illness found. CBC and Dengue NS1 were negative in Nov 2024. Penicillin allergy documented. Last visit: Viral fever, resolved in 5 days.',
    aiSources: ['Consult · Jun 2026', 'Prescription · Apr 2025', 'Lab report · Nov 2024'],
    events: [
      { id: 'e1', date: '9 Jun 2026',  type: 'consultation', title: 'Viral Fever — Acute', body: 'Fever 101°F · 3 days · mild headache. Paracetamol + ORS prescribed.' },
      { id: 'e2', date: '7 Apr 2025',  type: 'prescription',  title: 'Rx: Paracetamol 500mg · ORS', body: 'For viral fever. 1-0-1 for 5 days.' },
      { id: 'e3', date: '14 Nov 2024', type: 'report',        title: 'CBC + Dengue NS1 — Normal', body: 'Dengue NS1 negative. Platelets normal.' },
      { id: 'e4', date: '11 Nov 2024', type: 'consultation',  title: 'Fever Episode — Second Visit', body: 'Fever 100°F · 2 days. Sent for CBC.' },
    ],
  },
};

const TYPE_CONFIG: Record<string, { dot: string; label: string }> = {
  consultation: { dot: 'consultation', label: 'Consultation' },
  prescription:  { dot: 'prescription', label: 'Prescription' },
  report:        { dot: 'report',       label: 'Report' },
  followup:      { dot: 'followup',     label: 'Follow-up' },
};

const ICON: Record<string, string> = {
  consultation: '♥',
  prescription:  '✦',
  report:        '📄',
  followup:      '↺',
};

export function PatientThreadPage() {
  const { id } = useParams();
  const data = PATIENT_DATA[id ?? ''] || PATIENT_DATA['s1'];

  return (
    <main className="page">
      {/* Header */}
      <div className="page-header">
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="patient-avatar-lg">{data.initials}</div>
            <div>
              <h1 className="page-title" style={{ marginBottom: 2 }}>{data.name}</h1>
              <p className="page-subtitle">{data.age} yrs · {data.gender} · {data.bloodGroup} · <span className="mono">{data.curoId}</span></p>
            </div>
          </div>
          <Link to="/consultations" className="btn btn-primary">Open Consultation</Link>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left: AI Memory + Profile */}
        <div>
          {/* Profile card */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}>Profile</h2>
            <div className="snapshot-grid">
              <div className="snapshot-field">
                <div className="snapshot-label">Blood Group</div>
                <div className="snapshot-value">{data.bloodGroup}</div>
              </div>
              <div className="snapshot-field">
                <div className="snapshot-label">Gender</div>
                <div className="snapshot-value">{data.gender}</div>
              </div>
              <div className="snapshot-field">
                <div className="snapshot-label">Mobile</div>
                <div className="snapshot-value">{data.phone}</div>
              </div>
              <div className="snapshot-field">
                <div className="snapshot-label">Email</div>
                <div className="snapshot-value" style={{ fontSize: '0.75rem' }}>{data.email}</div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ marginBottom: 8 }}>
              <div className="snapshot-label" style={{ marginBottom: 6 }}>Known allergies</div>
              <div className="pill-list">
                {data.allergies.length
                  ? data.allergies.map((a: string) => <span key={a} className="pill" style={{ background: 'var(--error-bg)', borderColor: '#FECACA', color: 'var(--error)' }}>{a}</span>)
                  : <span className="text-sm text-muted">None reported</span>
                }
              </div>
            </div>
          </div>

          {/* AI Memory */}
          <div className="card mt-3">
            <div className="card-header">
              <h2 className="card-title">
                <span style={{ color: 'var(--primary)', marginRight: 6 }}>✦</span> AI Memory
              </h2>
              <button className="btn btn-ghost btn-sm">Edit</button>
            </div>
            <div className="ai-summary-box">
              {data.aiMemory}
              <div className="ai-summary-sources">
                {data.aiSources.map((src: string) => (
                  <span key={src} className="source-tag">◈ {src}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Share records */}
          <div className="card mt-3">
            <div className="card-header">
              <h2 className="card-title">Share records</h2>
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
              Generate a time-limited, single-use read-only link to share with another doctor.
            </p>
            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 12, fontSize: '0.8125rem' }}>
              <span className="text-muted">Expires:</span> 7 days · 1 view · revocable
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm">Generate share link</button>
              <button className="btn btn-ghost btn-sm text-muted">Revoke active link</button>
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Health timeline</h2>
            <span className="badge badge-neutral">{data.events.length} events</span>
          </div>
          <div className="timeline">
            {data.events.map((ev: any) => {
              const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.consultation;
              return (
                <div key={ev.id} className="timeline-item">
                  <div className={`timeline-dot ${cfg.dot}`}>
                    {ICON[ev.type] || '·'}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-date">{ev.date}</div>
                    <div className="timeline-title">{ev.title}</div>
                    <div className="timeline-body">{ev.body}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge badge-${cfg.dot === 'consultation' ? 'primary' : cfg.dot === 'prescription' ? 'success' : cfg.dot === 'report' ? 'warning' : 'info'}`} style={{ fontSize: '0.65rem' }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
