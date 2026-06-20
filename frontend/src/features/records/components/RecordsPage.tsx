import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { patientApi } from '../../../shared/api';

interface PatientProfile {
  full_name: string;
  gender: string | null;
  age: number | null;
  blood_group: string | null;
  allergies: string[];
  mobile: string;
  email: string | null;
  onboarding_complete: boolean;
}

interface HealthThread {
  appointments: any[];
  prescriptions: any[];
  documents: any[];
}

const GENDER_LABELS: Record<string, string> = {
  male:              'Male',
  female:            'Female',
  other:             'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export function RecordsPage() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';

  const [profile, setProfile]   = useState<PatientProfile | null>(null);
  const [thread, setThread]     = useState<HealthThread | null>(null);
  const [loading, setLoading]   = useState(isPatient);
  const [tab, setTab]           = useState<'overview' | 'prescriptions' | 'reports'>('overview');

  useEffect(() => {
    if (!isPatient) return;
    async function load() {
      const [profileRes, threadRes] = await Promise.all([
        patientApi.getMe(),
        patientApi.getMyRecords(),
      ]);
      if (profileRes.data?.success) setProfile(profileRes.data.data as unknown as PatientProfile);
      if (threadRes.data?.success) setThread(threadRes.data.data as unknown as HealthThread);

      setLoading(false);
    }
    load();
  }, [isPatient]);

  // ── Doctor view: simple empty state (health threads are in /health-threads) ──
  if (!isPatient) {
    return (
      <main className="page">
        <div className="page-header">
          <h1 className="page-title">Health Records</h1>
          <p className="page-subtitle">Patient records are accessed via Health Threads</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
          <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
            To view a patient's health records, open their thread from the Health Threads page.
          </p>
          <Link to="/health-threads" className="btn btn-primary">Go to Health Threads →</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page">
        <div className="page-header"><h1 className="page-title">My Records</h1></div>
        <div className="card" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Loading your records…
        </div>
      </main>
    );
  }

  // ── Patient view ──────────────────────────────────────────────────────────────
  const appointments = thread?.appointments || [];
  const prescriptions = thread?.prescriptions || [];
  const documents = thread?.documents || [];

  return (
    <main className="page">
      <div className="page-header">
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="patient-avatar-lg">
              {profile?.full_name
                ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : '?'}
            </div>
            <div>
              <h1 className="page-title" style={{ marginBottom: 2 }}>
                {profile?.full_name || 'My Records'}
              </h1>
              <p className="page-subtitle">
                {profile?.age && profile?.gender
                  ? `${profile.age} yrs · ${GENDER_LABELS[profile.gender] || profile.gender}${profile.blood_group ? ` · ${profile.blood_group}` : ''}`
                  : 'Patient health record'
                }
              </p>
            </div>
          </div>
          <Link to="/patient-profile" className="btn btn-secondary btn-sm">Edit Profile</Link>
        </div>
      </div>

      {/* Quick health stats */}
      {profile && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2 className="card-title">Health profile</h2>
          </div>
          <div className="snapshot-grid">
            {[
              { label: 'Blood Group', value: profile.blood_group || '—' },
              { label: 'Age', value: profile.age ? `${profile.age} years` : '—' },
              { label: 'Gender', value: profile.gender ? GENDER_LABELS[profile.gender] || profile.gender : '—' },
              { label: 'Mobile', value: `+91 ${profile.mobile}` },
            ].map((f) => (
              <div key={f.label} className="snapshot-field">
                <div className="snapshot-label">{f.label}</div>
                <div className="snapshot-value">{f.value}</div>
              </div>
            ))}
          </div>
          {(profile.allergies || []).length > 0 && (
            <>
              <div className="divider" />
              <div className="snapshot-label" style={{ marginBottom: 8 }}>Known allergies</div>
              <div className="pill-list">
                {(profile.allergies || []).map((a) => (
                  <span key={a} className="pill" style={{ background: 'var(--error-bg)', borderColor: '#FECACA', color: 'var(--error)' }}>{a}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-3)' }}>
        {(['overview', 'prescriptions', 'reports'] as const).map((t) => (
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
        appointments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🩺</div>
            <h2 style={{ marginBottom: 8 }}>No consultations yet</h2>
            <p className="text-muted text-sm" style={{ maxWidth: 380, margin: '0 auto 20px' }}>
              Your consultation history will appear here once you've booked and completed an appointment.
            </p>
            <Link to="/booking/details" className="btn btn-primary">Book a Consultation</Link>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Consultation history</h2>
              <span className="badge badge-neutral">{appointments.length} visits</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Doctor</th><th>Complaint</th><th>Type</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="text-sm">{a.slot_date}</td>
                    <td className="text-sm font-medium">{a.doctor_name}</td>
                    <td className="text-sm">{a.chief_complaint}</td>
                    <td><span className="badge badge-neutral">{a.consultation_type}</span></td>
                    <td><span className="badge badge-success">{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Prescriptions tab */}
      {tab === 'prescriptions' && (
        prescriptions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💊</div>
            <p className="text-muted text-sm">No prescriptions yet. They'll appear here after your first consultation.</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Prescriptions</h2>
              <span className="badge badge-neutral">{prescriptions.length}</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Diagnosis</th><th>Doctor</th><th></th></tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td className="text-sm">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="text-sm">{p.diagnosis}</td>
                    <td className="text-sm">{p.doctor_name}</td>
                    <td><button className="btn btn-ghost btn-sm">Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        documents.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
            <p className="text-muted text-sm">No uploaded reports yet.</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Uploaded reports</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Report</th><th>Date</th><th>Size</th><th></th></tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="text-sm font-medium">{d.original_name}</td>
                    <td className="text-sm">{new Date(d.uploaded_at).toLocaleDateString('en-IN')}</td>
                    <td className="text-xs text-muted">{Math.round(d.file_size_bytes / 1024)} KB</td>
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
        )
      )}
    </main>
  );
}
