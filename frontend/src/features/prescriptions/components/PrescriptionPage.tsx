import { useState } from 'react';

type MedRow = { drug: string; dose: string; freq: string; duration: string; instructions: string };

const PRESCRIPTIONS = [
  {
    id: 'rx1',
    serial: 'RX-SHARMA-0143',
    patient: 'Rohan Kumar',
    initials: 'RK',
    age: 34,
    date: '2026-06-09',
    diagnosis: 'Viral fever — acute',
    status: 'Sent',
    statusClass: 'badge-success',
    medications: [
      { drug: 'Paracetamol 500mg', dose: '1 tab', freq: '1-0-1', duration: '5 days', instructions: 'After food' },
      { drug: 'ORS sachets', dose: '1 sachet', freq: '0-1-0', duration: '3 days', instructions: 'In 200ml water' },
    ],
    advice: 'Rest and adequate hydration. Return if fever > 103°F or persists beyond 5 days.',
    followUp: '2026-06-14',
    verifyUrl: 'curo.app/rx/rx_7f3a2',
  },
  {
    id: 'rx2',
    serial: 'RX-SHARMA-0142',
    patient: 'Priya Mehta',
    initials: 'PM',
    age: 27,
    date: '2026-06-08',
    diagnosis: 'Migraine — episodic without aura',
    status: 'Sent',
    statusClass: 'badge-success',
    medications: [
      { drug: 'Sumatriptan 50mg', dose: '1 tab', freq: '1-0-0', duration: 'As needed (max 2/day)', instructions: 'At onset of headache' },
      { drug: 'Domperidone 10mg', dose: '1 tab', freq: '1-1-1', duration: '3 days', instructions: '30 min before meals' },
    ],
    advice: 'Avoid screen time during episodes. Maintain headache diary.',
    followUp: '2026-07-01',
    verifyUrl: 'curo.app/rx/rx_4b9c1',
  },
  {
    id: 'rx3',
    serial: 'RX-SHARMA-0141',
    patient: 'Ankit Joshi',
    initials: 'AJ',
    age: 45,
    date: '2026-06-05',
    diagnosis: 'Lumbar disc disease — L4–L5 with muscle spasm',
    status: 'Sent',
    statusClass: 'badge-success',
    medications: [
      { drug: 'Diclofenac 50mg', dose: '1 tab', freq: '1-0-1', duration: '7 days', instructions: 'After food' },
      { drug: 'Thiocolchicoside 4mg', dose: '1 tab', freq: '1-0-1', duration: '7 days', instructions: 'After food' },
      { drug: 'Pantoprazole 40mg', dose: '1 tab', freq: '1-0-0', duration: '7 days', instructions: 'Before breakfast' },
    ],
    advice: 'Physiotherapy referral advised. Avoid prolonged sitting. Apply heat pack.',
    followUp: '2026-06-19',
    verifyUrl: 'curo.app/rx/rx_9e1d4',
  },
];

function emptyMed(): MedRow { return { drug: '', dose: '', freq: '1-0-1', duration: '', instructions: '' }; }

export function PrescriptionPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedRx, setSelectedRx] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState<MedRow[]>([emptyMed()]);
  const [investigations, setInvestigations] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [sent, setSent] = useState(false);

  function addMed() { setMedications((prev) => [...prev, emptyMed()]); }
  function removeMed(i: number) { setMedications((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateMed(i: number, f: keyof MedRow, v: string) {
    setMedications((prev) => prev.map((m, idx) => idx === i ? { ...m, [f]: v } : m));
  }

  const viewRx = PRESCRIPTIONS.find((r) => r.id === selectedRx);

  return (
    <main className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Prescriptions</h1>
            <p className="page-subtitle">Issue digital prescriptions · Send via WhatsApp · Auto-saved to patient health thread</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowBuilder(true); setSelectedRx(null); }}>
            + New Prescription
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left: Recent prescriptions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent prescriptions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {PRESCRIPTIONS.map((rx) => (
              <div
                key={rx.id}
                onClick={() => { setSelectedRx(rx.id); setShowBuilder(false); }}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 150ms',
                  background: selectedRx === rx.id ? 'var(--primary-muted)' : 'transparent',
                  paddingLeft: selectedRx === rx.id ? 8 : 0,
                }}
              >
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="appt-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>{rx.initials}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rx.patient}</div>
                      <div className="text-xs text-muted">{rx.age} yrs</div>
                    </div>
                  </div>
                  <span className={`badge ${rx.statusClass}`}>{rx.status}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {rx.diagnosis}
                </div>
                <div className="flex-between">
                  <span className="mono text-xs text-muted">{rx.serial}</span>
                  <span className="text-xs text-muted">{rx.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail or builder */}
        <div>
          {/* View Prescription */}
          {selectedRx && viewRx && !showBuilder && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">{viewRx.diagnosis}</h2>
                  <div className="mono text-xs text-muted">{viewRx.serial}</div>
                </div>
                <span className={`badge ${viewRx.statusClass}`}>{viewRx.status}</span>
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)', marginBottom: 16, fontSize: '0.8125rem' }}>
                <div className="flex-between">
                  <span><strong>{viewRx.patient}</strong> · {viewRx.age} yrs</span>
                  <span className="text-muted">{viewRx.date}</span>
                </div>
                <div className="text-muted" style={{ marginTop: 2 }}>Dr. Arun Sharma · MBBS, MD · MH-2010-45821</div>
              </div>

              <div className="section-title" style={{ marginBottom: 8 }}>Medications</div>
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>Drug</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewRx.medications.map((m, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{m.drug}</td>
                        <td>{m.dose}</td>
                        <td><span className="mono">{m.freq}</span></td>
                        <td>{m.duration}</td>
                        <td className="text-muted">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div className="section-title">Advice</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{viewRx.advice}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="section-title">Follow-up</div>
                <span className="mono text-sm">{viewRx.followUp}</span>
              </div>

              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 16, fontSize: '0.75rem' }}>
                <span className="text-muted">Verify at: </span>
                <span className="mono" style={{ color: 'var(--primary)' }}>{viewRx.verifyUrl}</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm">Download PDF</button>
                <button className="btn btn-ghost btn-sm">Resend WhatsApp</button>
                <button className="btn btn-ghost btn-sm">Amend</button>
              </div>
            </div>
          )}

          {/* New Prescription Builder */}
          {showBuilder && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">New prescription</h2>
                <span className="mono text-xs text-muted">RX-SHARMA-0144</span>
              </div>

              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: '0.8125rem' }}>
                <strong>Patient:</strong> Select from today's appointments &nbsp;
                <select className="select input" style={{ width: 'auto', display: 'inline-block', height: 30, fontSize: '0.8125rem' }}>
                  <option>Rohan Kumar · 34M</option>
                  <option>Priya Mehta · 27F</option>
                  <option>Ankit Joshi · 45M</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Diagnosis <span style={{ color: 'var(--error)' }}>*</span></label>
                <input className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 8 }}>Medications</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="rx-table">
                    <thead>
                      <tr><th>Drug name</th><th>Dose</th><th>Freq</th><th>Duration</th><th>Instructions</th><th></th></tr>
                    </thead>
                    <tbody>
                      {medications.map((m, i) => (
                        <tr key={i}>
                          <td><input className="input" value={m.drug} onChange={(e) => updateMed(i, 'drug', e.target.value)} placeholder="Drug name" /></td>
                          <td><input className="input" value={m.dose} onChange={(e) => updateMed(i, 'dose', e.target.value)} placeholder="1 tab" /></td>
                          <td>
                            <select className="select input" value={m.freq} onChange={(e) => updateMed(i, 'freq', e.target.value)}>
                              {['1-0-0','0-1-0','0-0-1','1-1-0','1-0-1','0-1-1','1-1-1'].map((f) => <option key={f}>{f}</option>)}
                            </select>
                          </td>
                          <td><input className="input" value={m.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)} placeholder="5 days" /></td>
                          <td><input className="input" value={m.instructions} onChange={(e) => updateMed(i, 'instructions', e.target.value)} placeholder="After food" /></td>
                          <td><button className="btn btn-danger btn-sm" onClick={() => removeMed(i)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addMed}>+ Add medication</button>
              </div>

              <div className="form-group">
                <label className="form-label">Investigations</label>
                <textarea className="textarea" rows={2} value={investigations} onChange={(e) => setInvestigations(e.target.value)} placeholder="e.g. CBC, LFT" />
              </div>
              <div className="form-group">
                <label className="form-label">Advice / Instructions</label>
                <textarea className="textarea" rows={2} value={advice} onChange={(e) => setAdvice(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up date</label>
                <input className="input" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} style={{ width: 200 }} />
              </div>

              {sent ? (
                <div className="notice notice-success">Prescription sent via WhatsApp. Saved to patient's health thread. ✓</div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => setSent(true)} disabled={!diagnosis}>Send via WhatsApp</button>
                  <button className="btn btn-secondary" disabled={!diagnosis}>Save PDF</button>
                  <button className="btn btn-ghost" onClick={() => { setShowBuilder(false); setSent(false); }}>Cancel</button>
                </div>
              )}
            </div>
          )}

          {!selectedRx && !showBuilder && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <p>Select a prescription to view, or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
