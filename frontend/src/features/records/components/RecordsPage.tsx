import { useState } from 'react';

const PATIENT = {
  name: 'Rohan Kumar',
  age: 34,
  gender: 'Male',
  bloodGroup: 'B+',
  allergies: ['Penicillin'],
  curoId: 'PAT-000142',
};

const CONSULTATIONS = [
  { id: 'c1', date: '9 Jun 2026',  doctor: 'Dr. Arun Sharma', complaint: 'Viral fever',      type: 'Online',    status: 'Completed', hasRx: true  },
  { id: 'c2', date: '7 Apr 2025',  doctor: 'Dr. Arun Sharma', complaint: 'Fever follow-up',  type: 'Online',    status: 'Completed', hasRx: true  },
  { id: 'c3', date: '11 Nov 2024', doctor: 'Dr. Arun Sharma', complaint: 'Viral fever',      type: 'In-person', status: 'Completed', hasRx: true  },
  { id: 'c4', date: '3 Mar 2024',  doctor: 'Dr. Arun Sharma', complaint: 'Gastritis',        type: 'In-person', status: 'Completed', hasRx: false },
];

const PRESCRIPTIONS = [
  { id: 'p1', date: '9 Jun 2026',  serial: 'RX-SHARMA-0143', drugs: 'Paracetamol 500mg, ORS',     doctor: 'Dr. Arun Sharma' },
  { id: 'p2', date: '7 Apr 2025',  serial: 'RX-SHARMA-0119', drugs: 'Paracetamol 500mg, ORS',     doctor: 'Dr. Arun Sharma' },
  { id: 'p3', date: '12 Nov 2024', serial: 'RX-SHARMA-0097', drugs: 'Paracetamol, Domperidone',   doctor: 'Dr. Arun Sharma' },
];

const REPORTS = [
  { id: 'r1', name: 'CBC with differential', date: '14 Nov 2024', type: 'Blood test', size: '245 KB' },
  { id: 'r2', name: 'Dengue NS1 Antigen', date: '14 Nov 2024', type: 'Serology', size: '112 KB' },
];

type Tab = 'overview' | 'prescriptions' | 'reports';

export function RecordsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [shareGenerated, setShareGenerated] = useState(false);

  return (
    <main className="page">
      <div className="page-header">
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="patient-avatar-lg">{PATIENT.name.split(' ').map((n) => n[0]).join('')}</div>
            <div>
              <h1 className="page-title" style={{ marginBottom: 2 }}>{PATIENT.name}</h1>
              <p className="page-subtitle">{PATIENT.age} yrs · {PATIENT.gender} · {PATIENT.bloodGroup} · <span className="mono">{PATIENT.curoId}</span></p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShareGenerated(true)}>
            Share Records
          </button>
        </div>
      </div>

      {/* Share link */}
      {shareGenerated && (
        <div className="notice notice-success" style={{ marginBottom: 20 }}>
          <div>
            <strong>Share link generated</strong> — expires in 7 days, single use, revocable.
            <div className="mono" style={{ marginTop: 4, color: 'var(--primary)' }}>
              curo.app/share/tkn_7f3a2b9c
            </div>
          </div>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setShareGenerated(false)}>Revoke</button>
        </div>
      )}

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <h2 className="card-title">Health profile</h2>
          <button className="btn btn-ghost btn-sm">Edit</button>
        </div>
        <div className="snapshot-grid">
          {[
            { label: 'Blood Group', value: PATIENT.bloodGroup },
            { label: 'Age', value: `${PATIENT.age} years` },
            { label: 'Gender', value: PATIENT.gender },
            { label: 'CURO Patient ID', value: PATIENT.curoId },
          ].map((f) => (
            <div key={f.label} className="snapshot-field">
              <div className="snapshot-label">{f.label}</div>
              <div className="snapshot-value">{f.value}</div>
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="snapshot-label" style={{ marginBottom: 6 }}>Known allergies</div>
        <div className="pill-list">
          {PATIENT.allergies.map((a) => (
            <span key={a} className="pill" style={{ background: 'var(--error-bg)', borderColor: '#FECACA', color: 'var(--error)' }}>{a}</span>
          ))}
          <button className="btn btn-ghost btn-sm">+ Add allergy</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-3)' }}>
        {(['overview', 'prescriptions', 'reports'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              fontSize: '0.875rem',
              textTransform: 'capitalize',
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Consultation history</h2>
            <span className="badge badge-neutral">{CONSULTATIONS.length} visits</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Complaint</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rx</th>
              </tr>
            </thead>
            <tbody>
              {CONSULTATIONS.map((c) => (
                <tr key={c.id}>
                  <td className="text-sm">{c.date}</td>
                  <td className="text-sm font-medium">{c.doctor}</td>
                  <td className="text-sm">{c.complaint}</td>
                  <td><span className="badge badge-neutral">{c.type}</span></td>
                  <td><span className="badge badge-success">{c.status}</span></td>
                  <td>{c.hasRx ? <span className="badge badge-primary">Rx</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prescriptions tab */}
      {tab === 'prescriptions' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All prescriptions</h2>
            <span className="badge badge-neutral">{PRESCRIPTIONS.length} prescriptions</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Serial</th><th>Medications</th><th>Doctor</th><th></th></tr>
            </thead>
            <tbody>
              {PRESCRIPTIONS.map((p) => (
                <tr key={p.id}>
                  <td className="text-sm">{p.date}</td>
                  <td className="mono text-xs">{p.serial}</td>
                  <td className="text-sm">{p.drugs}</td>
                  <td className="text-sm">{p.doctor}</td>
                  <td><button className="btn btn-ghost btn-sm">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Uploaded reports</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Report</th><th>Type</th><th>Date</th><th>Size</th><th></th></tr>
            </thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.id}>
                  <td className="text-sm font-medium">{r.name}</td>
                  <td><span className="badge badge-neutral">{r.type}</span></td>
                  <td className="text-sm">{r.date}</td>
                  <td className="text-xs text-muted">{r.size}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm">View</button>
                      <button className="btn btn-ghost btn-sm">Download</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
