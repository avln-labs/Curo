import { useState } from 'react';
import { Link } from 'react-router-dom';

const SESSIONS = [
  {
    id: 's1',
    patientName: 'Rohan Kumar',
    initials: 'RK',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    complaint: 'Recurring fever — 3 days',
    consultType: 'Online',
    time: '09:00 AM',
    status: 'In Progress',
    statusClass: 'badge-info',
    history: ['Paracetamol 500mg · Nov 2024', 'ORS sachets · Apr 2025'],
    pastReports: ['CBC report · Nov 2024', 'Dengue NS1 · Nov 2024'],
    symptoms: 'Fever starting 3 days ago, temperature around 101°F. Associated mild headache and fatigue. No cold or cough. Not eating well.',
    aiSummary: 'Patient has a history of 2 similar fever episodes (Apr 2025, Nov 2024). In both prior visits fever resolved within 5 days with Paracetamol and oral rehydration. CBC and Dengue NS1 were negative in November 2024. No known drug allergies except Penicillin. Current episode: Fever 101°F, 3 days, with mild headache. No respiratory symptoms.',
    aiSources: ['Intake form · Today', 'Consult note · Apr 2025', 'Prescription · Nov 2024', 'Lab report · Nov 2024'],
  },
  {
    id: 's2',
    patientName: 'Priya Mehta',
    initials: 'PM',
    age: 27,
    gender: 'Female',
    bloodGroup: 'O+',
    allergies: [],
    complaint: 'Migraine headache — 2 days',
    consultType: 'Online',
    time: '09:30 AM',
    status: 'Confirmed',
    statusClass: 'badge-success',
    history: ['Sumatriptan 50mg · Jan 2026', 'Paracetamol 500mg · Mar 2026'],
    pastReports: ['MRI Brain (normal) · Sep 2025'],
    symptoms: 'Severe unilateral headache since 2 days, left temporal region. Associated nausea, photophobia. No fever. Similar to previous episodes.',
    aiSummary: 'Established migraine patient. MRI Brain (Sep 2025) was normal. Has used Sumatriptan successfully in Jan 2026 and Mar 2026. Triggers identified: screen time, skipped meals. No aura. Current episode: 2 days, left temporal, pulsating, severity 7/10.',
    aiSources: ['Intake form · Today', 'Consult note · Mar 2026', 'Prescription · Jan 2026', 'MRI report · Sep 2025'],
  },
  {
    id: 's3',
    patientName: 'Ankit Joshi',
    initials: 'AJ',
    age: 45,
    gender: 'Male',
    bloodGroup: 'A+',
    allergies: [],
    complaint: 'Back pain — chronic, 3 weeks',
    consultType: 'In-person',
    time: '10:00 AM',
    status: 'Confirmed',
    statusClass: 'badge-success',
    history: ['Diclofenac gel · Feb 2026', 'Muscle relaxant · Dec 2025'],
    pastReports: ['X-ray Lumbar · Dec 2025'],
    symptoms: 'Lower back pain, L4–L5 region, worsens with prolonged sitting. Radiates slightly to left buttock. No bladder or bowel symptoms.',
    aiSummary: 'Patient has chronic lower back pain. X-ray (Dec 2025) showed mild L4–L5 disc space narrowing, no fracture. Responded partially to topical Diclofenac and muscle relaxant. Occupation involves long hours at desk. Physiotherapy not yet attempted.',
    aiSources: ['Intake form · Today', 'Consult note · Feb 2026', 'X-ray report · Dec 2025'],
  },
];

type MedRow = { drug: string; dose: string; freq: string; duration: string; instructions: string };

function emptyMed(): MedRow { return { drug: '', dose: '', freq: '1-0-1', duration: '5 days', instructions: '' }; }

export function ConsultationDashboard() {
  const [selectedId, setSelectedId] = useState(SESSIONS[0].id);
  const [notes, setNotes] = useState('Patient appears mildly distressed. Temp 100.8°F on examination. No lymphadenopathy. Throat mild erythema.');
  const [diagnosis, setDiagnosis] = useState('Viral fever — acute');
  const [medications, setMedications] = useState<MedRow[]>([
    { drug: 'Paracetamol 500mg', dose: '1 tablet', freq: '1-0-1', duration: '5 days', instructions: 'After food' },
    { drug: 'ORS sachets', dose: '1 sachet', freq: '0-1-0', duration: '3 days', instructions: 'In 200ml water' },
  ]);
  const [investigations, setInvestigations] = useState('CBC with differential, MP smear');
  const [advice, setAdvice] = useState('Rest and adequate hydration. Avoid cold exposure. Return if fever persists beyond 5 days or exceeds 103°F.');
  const [followUp, setFollowUp] = useState('2026-06-14');
  const [aiEdited, setAiEdited] = useState(false);
  const [editingAi, setEditingAi] = useState(false);
  const [aiText, setAiText] = useState('');
  const [rxSent, setRxSent] = useState(false);

  const session = SESSIONS.find((s) => s.id === selectedId)!;

  function addMed() { setMedications((prev) => [...prev, emptyMed()]); }
  function removeMed(i: number) { setMedications((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateMed(i: number, field: keyof MedRow, val: string) {
    setMedications((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Consultation Workspace</h1>
        <p className="page-subtitle">Select a session · Review patient snapshot · Start consultation</p>
      </div>

      {/* Session selector */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <h2 className="card-title">Active sessions</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {SESSIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: `1px solid ${selectedId === s.id ? 'var(--primary)' : 'var(--border)'}`,
                background: selectedId === s.id ? 'var(--primary-muted)' : 'var(--surface)',
                cursor: 'pointer',
                minWidth: 180,
                transition: 'all 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="appt-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>{s.initials}</div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.patientName}</span>
              </div>
              <span className="text-xs text-muted">{s.time} · {s.consultType}</span>
              <span className={`badge ${s.statusClass}`}>{s.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left column */}
        <div>
          {/* Patient Snapshot */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Patient snapshot</h2>
              <Link to={`/patient-thread/${session.id}`} className="btn btn-ghost btn-sm">View thread →</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="patient-avatar-lg">{session.initials}</div>
              <div>
                <h3 style={{ marginBottom: 2 }}>{session.patientName}</h3>
                <p className="text-sm text-muted">{session.age} yrs · {session.gender} · {session.consultType}</p>
              </div>
            </div>

            <div className="snapshot-grid">
              <div className="snapshot-field">
                <div className="snapshot-label">Blood Group</div>
                <div className="snapshot-value">{session.bloodGroup}</div>
              </div>
              <div className="snapshot-field">
                <div className="snapshot-label">Allergies</div>
                <div className="snapshot-value">{session.allergies.length ? session.allergies.join(', ') : 'None reported'}</div>
              </div>
            </div>

            <div className="divider" />

            <div style={{ marginBottom: 12 }}>
              <div className="section-title">Past prescriptions</div>
              <div className="pill-list">
                {session.history.map((h) => <span key={h} className="pill">{h}</span>)}
              </div>
            </div>

            <div>
              <div className="section-title">Past reports</div>
              <div className="pill-list">
                {session.pastReports.map((r) => <span key={r} className="pill">{r}</span>)}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="card mt-3">
            <div className="card-header">
              <h2 className="card-title">
                <span style={{ color: 'var(--primary)', marginRight: 6 }}>✦</span> AI Pre-Consult Summary
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingAi(!editingAi); setAiText(session.aiSummary); }}>
                  {editingAi ? 'Cancel' : 'Edit'}
                </button>
                <button className="btn btn-ghost btn-sm">Regenerate ↺</button>
              </div>
            </div>

            {editingAi ? (
              <div>
                <textarea
                  className="textarea"
                  rows={6}
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingAi(false); setAiEdited(true); }}>Save edit</button>
              </div>
            ) : (
              <div className="ai-summary-box">
                {aiEdited ? aiText : session.aiSummary}
                <div className="ai-summary-sources">
                  {session.aiSources.map((src) => (
                    <span key={src} className="source-tag">◈ {src}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Symptoms */}
          <div className="card mt-3">
            <h2 className="card-title" style={{ marginBottom: 12 }}>Symptoms reported by patient</h2>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)', fontStyle: 'italic' }}>
              "{session.symptoms}"
            </p>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Consultation Notes */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Consultation notes</h2>
              <span className="text-xs text-muted">Autosaved</span>
            </div>
            <textarea
              className="textarea"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, examination findings, differential diagnosis…"
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary">Start Consultation</button>
              <button className="btn btn-secondary">End & Mark Done</button>
            </div>
          </div>

          {/* Prescription Builder */}
          <div className="card mt-3">
            <div className="card-header">
              <h2 className="card-title">Prescription builder</h2>
              <span className="mono text-xs text-muted">RX-SHARMA-0143</span>
            </div>

            <div className="form-group">
              <label className="form-label">Diagnosis <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis" />
            </div>

            {/* Medications table */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>Medications</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>Drug name</th>
                      <th>Dose</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((m, i) => (
                      <tr key={i}>
                        <td><input className="input" value={m.drug} onChange={(e) => updateMed(i, 'drug', e.target.value)} placeholder="e.g. Paracetamol 500mg" /></td>
                        <td><input className="input" value={m.dose} onChange={(e) => updateMed(i, 'dose', e.target.value)} placeholder="1 tablet" /></td>
                        <td>
                          <select className="select input" value={m.freq} onChange={(e) => updateMed(i, 'freq', e.target.value)}>
                            {['1-0-0','0-1-0','0-0-1','1-1-0','1-0-1','0-1-1','1-1-1'].map((f) => <option key={f}>{f}</option>)}
                          </select>
                        </td>
                        <td><input className="input" value={m.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)} placeholder="5 days" /></td>
                        <td><input className="input" value={m.instructions} onChange={(e) => updateMed(i, 'instructions', e.target.value)} placeholder="After food" /></td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeMed(i)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addMed}>+ Add medication</button>
            </div>

            <div className="form-group">
              <label className="form-label">Investigations ordered</label>
              <textarea className="textarea" rows={2} value={investigations} onChange={(e) => setInvestigations(e.target.value)} placeholder="e.g. CBC, LFT, Chest X-ray" />
            </div>

            <div className="form-group">
              <label className="form-label">Advice / Instructions</label>
              <textarea className="textarea" rows={2} value={advice} onChange={(e) => setAdvice(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up date</label>
              <input className="input" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} style={{ width: 200 }} />
            </div>

            {rxSent ? (
              <div className="notice notice-success">Prescription sent via WhatsApp to {session.patientName}. Saved to health thread. ✓</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary" onClick={() => setRxSent(true)}>Send via WhatsApp</button>
                <button className="btn btn-secondary">Save PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
