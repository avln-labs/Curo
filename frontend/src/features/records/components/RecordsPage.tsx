import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { patientApi, bookingsApi, api, documentsApi, type PatientDocument, API_BASE } from '../../../shared/api';
import { RecordUpload } from './RecordUpload';
import { FileIcon } from '../../../shared/components/FileIcon';

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

function canJoinConsultation(slotDate: string, slotTime: string, status: string) {
  if (!slotDate || !slotTime) return false;
  if (status === 'completed' || status === 'cancelled') return false;
  const datePart = new Date(slotDate).toISOString().split('T')[0];
  const startTimeStr = `${datePart}T${slotTime.slice(0,5)}:00`;
  const startTime = new Date(startTimeStr).getTime();
  const now = Date.now();
  // Available 10 mins before start, and up to 2 hours after start (in case doctor hasn't ended it yet)
  return now >= (startTime - 10 * 60 * 1000) && now <= (startTime + 2 * 60 * 60 * 1000);
}

function formatTime12H(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.slice(0, 2)} ${suffix}`;
}

export function RecordsPage() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';

  const [profile, setProfile]   = useState<PatientProfile | null>(null);
  const [thread, setThread]     = useState<HealthThread | null>(null);
  const [loading, setLoading]   = useState(isPatient);
  const [tab, setTab]           = useState<'overview' | 'prescriptions' | 'reports'>('overview');

  const [docs, setDocs] = useState<PatientDocument[]>([]);
  const [docBusyId, setDocBusyId] = useState('');

  const [rescheduleAppt, setRescheduleAppt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);

  useEffect(() => {
    if (!rescheduleAppt) return;
    async function loadSlots() {
      try {
        const res = await api.get<{ success: boolean; data: any }>(`/doctors/${rescheduleAppt.doctor_slug}/slots?date=${rescheduleDate}`);
        if (res.data?.success) setSlots(res.data.data.slots);
      } catch {
        setSlots([]);
      }
    }
    loadSlots();
  }, [rescheduleAppt, rescheduleDate]);

  const handleRescheduleSubmit = async () => {
    if (!rescheduleTime) return alert('Select a time slot');
    setLoading(true);
    const res = await bookingsApi.reschedule(rescheduleAppt.id, { slotDate: rescheduleDate, slotTime: rescheduleTime });
    if (res.data?.success) {
      setRescheduleAppt(null);
      const threadRes = await patientApi.getMyRecords();
      if (threadRes.data?.success) setThread(threadRes.data.data as unknown as HealthThread);
    } else {
      alert(res.error || 'Failed to reschedule');
    }
    setLoading(false);
  };

  const loadDocs = async () => {
    const res = await documentsApi.listMine();
    if (res.data?.success) setDocs(res.data.data);
  };

  useEffect(() => {
    if (!isPatient) return;
    async function load() {
      const [profileRes, threadRes] = await Promise.all([
        patientApi.getMe(),
        patientApi.getMyRecords(),
      ]);
      if (profileRes.data?.success) setProfile(profileRes.data.data as unknown as PatientProfile);
      if (threadRes.data?.success) setThread(threadRes.data.data as unknown as HealthThread);
      loadDocs();

      setLoading(false);
    }
    load();
  }, [isPatient]);

  const handleViewDoc = async (doc: PatientDocument, download = false) => {
    setDocBusyId(doc.id);
    const { url, error } = await documentsApi.getFileUrl(doc.id, !download);
    setDocBusyId('');
    if (!url) return alert(error || 'Could not load file.');
    if (download) {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteDoc = async (doc: PatientDocument) => {
    if (!window.confirm(`Delete "${doc.originalName}"? Doctors will no longer see it.`)) return;
    const res = await documentsApi.remove(doc.id);
    if (res.data?.success) loadDocs();
    else alert(res.error || 'Failed to delete.');
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setLoading(true);
    const res = await bookingsApi.cancel(id);
    if (res.data?.success) {
      const threadRes = await patientApi.getMyRecords();
      if (threadRes.data?.success) setThread(threadRes.data.data as unknown as HealthThread);
    } else {
      alert(res.error || 'Failed to cancel');
    }
    setLoading(false);
  };

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

  const startingSoonAppts = appointments.filter(a => a.status === 'confirmed' && canJoinConsultation(a.slot_date, a.slot_time, a.status));

  return (
    <main className="page">
      {startingSoonAppts.length > 0 && (
        <div style={{ background: 'var(--primary)', color: 'white', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>Appointment Starting Soon!</strong>
            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Your consultation with {startingSoonAppts[0].doctor_name} is starting.</div>
          </div>
          {startingSoonAppts[0].meet_link && (
            <a href={startingSoonAppts[0].meet_link} target="_blank" rel="noreferrer" className="btn" style={{ background: 'white', color: 'var(--primary)' }}>
              Join Now
            </a>
          )}
        </div>
      )}

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
                  <th>Date</th><th>Doctor</th><th>Complaint</th><th>Type</th><th>Status</th><th>Meet Link</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="text-sm">{new Date(a.slot_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</td>
                    <td className="text-sm font-medium">{a.doctor_name}</td>
                    <td className="text-sm">{a.chief_complaint}</td>
                    <td><span className="badge badge-neutral">{a.consultation_type}</span></td>
                    <td><span className="badge badge-success">{a.status}</span></td>
                    <td>
                      {a.meet_link ? (
                        canJoinConsultation(a.slot_date, a.slot_time, a.status) ? (
                          <a href={a.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join Consultation</a>
                        ) : (
                          <span className="text-xs text-muted">Link unavailable</span>
                        )
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(a.status === 'confirmed' || a.status === 'payment_pending') && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleCancel(a.id)}>Cancel</button>
                        )}
                        {a.status === 'confirmed' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setRescheduleAppt(a)}>Reschedule</button>
                        )}
                      </div>
                    </td>
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
            {prescriptions.length === 0 ? (
              <div style={{ padding: '60px 32px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📝</div>
                <h3 style={{ marginBottom: 8 }}>No prescriptions found</h3>
                <p className="text-muted text-sm">You haven't received any digital prescriptions yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                {prescriptions.map((p, index) => {
                  const isLatest = index === 0;
                  return (
                  <div key={p.id} style={{ 
                    background: isLatest ? 'linear-gradient(135deg, var(--surface), var(--primary-muted))' : 'var(--surface)', 
                    border: '1px solid', 
                    borderColor: isLatest ? 'var(--primary)' : 'var(--border)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: isLatest ? 32 : 20, 
                    boxShadow: isLatest ? '0 8px 32px rgba(15, 118, 110, 0.15)' : 'var(--shadow-sm)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gridColumn: isLatest ? '1 / -1' : 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLatest ? 24 : 16, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        {isLatest && <div style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20, fontWeight: 700, display: 'inline-block', marginBottom: 12, letterSpacing: '1px' }}>LATEST PRESCRIPTION</div>}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                          {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <h3 style={{ margin: 0, fontSize: isLatest ? '1.5rem' : '1.1rem', fontWeight: 600, fontFamily: isLatest ? 'var(--font-serif)' : 'inherit', color: 'var(--text-primary)' }}>{p.diagnosis || 'General Prescription'}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>Dr. {p.doctor_name}</div>
                      </div>
                      <a href={`${API_BASE}/prescriptions/${p.id}/pdf`} target="_blank" rel="noreferrer" className="btn" style={{ background: isLatest ? 'var(--primary)' : 'var(--surface-card)', color: isLatest ? 'white' : 'var(--text-primary)', border: isLatest ? 'none' : '1px solid var(--border)', padding: '8px 16px', borderRadius: 20 }}>
                        View PDF
                      </a>
                    </div>
                    
                    {p.medications && p.medications.length > 0 && (
                      <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid rgba(255,255,255,0.8)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>Prescribed Medications</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {p.medications.slice(0, isLatest ? 5 : 3).map((m: any, i: number) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.drugName}</span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ background: 'var(--surface)', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', border: '1px solid var(--border)' }}>{m.frequency}</span>
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{m.duration}</span>
                              </div>
                            </li>
                          ))}
                          {p.medications.length > (isLatest ? 5 : 3) && (
                            <li style={{ fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'center', paddingTop: 8, fontWeight: 500 }}>
                              + {p.medications.length - (isLatest ? 5 : 3)} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        )
      )}

      {/* Reports tab — upload + manage previous medical records */}
      {tab === 'reports' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2 className="card-title">Add medical records</h2>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
              Upload previous reports, scans, or referral letters. Your doctor sees them
              automatically before every consultation.
            </p>
            <RecordUpload onUploaded={loadDocs} />
          </div>

          {docs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
              <p className="text-muted text-sm">No uploaded reports yet. Add your first record above.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Uploaded reports</h2>
                <span className="badge badge-neutral">{docs.length}</span>
              </div>
              <ul className="doc-list">
                {docs.map((d) => (
                  <li key={d.id} className="doc-item">
                    <FileIcon mimeType={d.mimeType} name={d.originalName} />
                    <div className="doc-item-body">
                      <div className="doc-item-name" title={d.originalName}>{d.originalName}</div>
                      <div className="doc-item-meta">
                        {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {d.fileSizeBytes >= 1024 * 1024
                          ? `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.max(1, Math.round(d.fileSizeBytes / 1024))} KB`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        className={`btn btn-ghost btn-sm${docBusyId === d.id ? ' loading' : ''}`}
                        onClick={() => handleViewDoc(d)}
                        disabled={docBusyId === d.id}
                      >
                        View
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleViewDoc(d, true)}>Download</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteDoc(d)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ padding: 24, width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 16 }}>Reschedule Appointment</h2>
            <div className="form-group">
              <label className="form-label">Select Date</label>
              <input type="date" className="input" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Available Slots</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                {slots.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No slots available.</div>
                ) : slots.map(s => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => setRescheduleTime(s.time)}
                    style={{
                      padding: '8px 0', borderRadius: 'var(--radius)', border: rescheduleTime === s.time ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: rescheduleTime === s.time ? 'var(--primary-muted)' : s.available ? 'var(--surface)' : 'var(--background)',
                      color: rescheduleTime === s.time ? 'var(--primary)' : s.available ? 'var(--text)' : 'var(--text-tertiary)',
                      cursor: s.available ? 'pointer' : 'not-allowed', fontSize: '0.875rem'
                    }}
                  >
                    {formatTime12H(s.time)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setRescheduleAppt(null)}>Close</button>
              <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handleRescheduleSubmit} disabled={!rescheduleTime || loading}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
