import { useState } from 'react';
import { Link } from 'react-router-dom';

const PATIENTS = [
  {
    id: 's1',
    name: 'Rohan Kumar',
    initials: 'RK',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    lastVisit: '9 Jun 2026',
    totalVisits: 4,
    lastComplaint: 'Viral fever',
    aiMemorySnippet: 'Recurring fever episodes. Responds to Paracetamol + ORS. No serious illness found.',
    tags: ['Fever', 'Gastritis'],
  },
  {
    id: 's2',
    name: 'Priya Mehta',
    initials: 'PM',
    age: 27,
    gender: 'Female',
    bloodGroup: 'O+',
    lastVisit: '8 Jun 2026',
    totalVisits: 3,
    lastComplaint: 'Migraine headache',
    aiMemorySnippet: 'Episodic migraine without aura. MRI normal (Sep 2025). Good response to Sumatriptan.',
    tags: ['Migraine'],
  },
  {
    id: 's3',
    name: 'Ankit Joshi',
    initials: 'AJ',
    age: 45,
    gender: 'Male',
    bloodGroup: 'A+',
    lastVisit: '5 Jun 2026',
    totalVisits: 2,
    lastComplaint: 'Back pain — L4–L5',
    aiMemorySnippet: 'Chronic lower back pain. X-ray showed disc space narrowing. Physiotherapy not yet attempted.',
    tags: ['Back pain', 'Chronic'],
  },
  {
    id: 'sr4',
    name: 'Sunita Rao',
    initials: 'SR',
    age: 52,
    gender: 'Female',
    bloodGroup: 'AB+',
    lastVisit: '3 Jun 2026',
    totalVisits: 7,
    lastComplaint: 'Diabetes follow-up',
    aiMemorySnippet: 'Type 2 Diabetes Mellitus — 6 years. HbA1c improving (last: 7.2%). On Metformin + Glipizide.',
    tags: ['Diabetes', 'Hypertension', 'Chronic'],
  },
  {
    id: 'kd5',
    name: 'Karan Desai',
    initials: 'KD',
    age: 31,
    gender: 'Male',
    bloodGroup: 'B-',
    lastVisit: '28 May 2026',
    totalVisits: 1,
    lastComplaint: 'Digestive complaint',
    aiMemorySnippet: 'First visit. Irritable bowel syndrome suspected. Dietary diary advised. No alarm features.',
    tags: ['Digestive'],
  },
  {
    id: 'mp6',
    name: 'Meera Pillai',
    initials: 'MP',
    age: 39,
    gender: 'Female',
    bloodGroup: 'A-',
    lastVisit: '20 May 2026',
    totalVisits: 2,
    lastComplaint: 'Skin rash',
    aiMemorySnippet: 'Contact dermatitis — likely detergent allergy. Responded to Hydrocortisone cream.',
    tags: ['Dermatology'],
  },
];

export function HealthThreadPage() {
  const [search, setSearch] = useState('');

  const filtered = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Patient Health Threads</h1>
            <p className="page-subtitle">Longitudinal memory for every patient — the core value of CURO</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          className="input"
          placeholder="Search patients by name or condition…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Patient thread cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filtered.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}
          >
            {/* Avatar */}
            <div className="patient-avatar-lg" style={{ flexShrink: 0 }}>{p.initials}</div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ margin: 0 }}>{p.name}</h3>
                  <span className="text-sm text-muted">{p.age} yrs · {p.gender} · {p.bloodGroup}</span>
                </div>
                <span className="text-xs text-muted">Last visit: {p.lastVisit}</span>
              </div>

              {/* AI memory snippet */}
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  lineHeight: 1.5,
                  maxWidth: '70ch',
                }}
              >
                {p.aiMemorySnippet}
              </p>

              {/* Tags + meta */}
              <div className="flex-between">
                <div className="pill-list">
                  {p.tags.map((t) => <span key={t} className="pill">{t}</span>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="text-xs text-muted">{p.totalVisits} visits</span>
                  <Link to={`/patient-thread/${p.id}`} className="btn btn-secondary btn-sm">
                    Open thread →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
            No patients found matching "{search}"
          </div>
        )}
      </div>
    </main>
  );
}
