import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { doctorApi } from '../../../shared/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function DoctorProfilePage() {
  const { user, mutateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'fees' | 'schedule'>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Profile Fields ──
  const [fullName, setFullName] = useState(user?.name || '');
  const [specialisations, setSpecialisations] = useState('');
  const [email, setEmail] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');

  // ── Fee Fields ──
  const [onlineFee, setOnlineFee] = useState('');
  const [onlineDuration, setOnlineDuration] = useState('15');
  const [inPersonFee, setInPersonFee] = useState('');
  const [inPersonDuration, setInPersonDuration] = useState('20');
  const [followUpFee, setFollowUpFee] = useState('');

  // ── Schedule Fields ──
  const [schedule, setSchedule] = useState<Record<string, { active: boolean; start: string; end: string }>>({
    Mon: { active: true, start: '09:00', end: '13:00' },
    Tue: { active: true, start: '09:00', end: '13:00' },
    Wed: { active: true, start: '09:00', end: '13:00' },
    Thu: { active: true, start: '09:00', end: '17:00' },
    Fri: { active: true, start: '09:00', end: '17:00' },
    Sat: { active: true, start: '09:00', end: '12:00' },
  });
  const [bufferMins, setBufferMins] = useState('5');
  const [maxPatients, setMaxPatients] = useState('25');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data, error: err } = await doctorApi.getProfile();
      if (!err && data?.success) {
        const d = data.data as any;
        if (d.full_name) setFullName(d.full_name);
        if (d.specialisations?.length) setSpecialisations(d.specialisations.join(', '));
        if (d.email) setEmail(d.email);
        if (d.slug) setBookingUrl(`curo.app/${d.slug}`);

        const consultationTypes = d.consultationTypes as any[] | undefined;
        if (consultationTypes) {
          const online = consultationTypes.find((c: any) => c.type === 'online');
          const inPerson = consultationTypes.find((c: any) => c.type === 'in_person');
          const followUp = consultationTypes.find((c: any) => c.type === 'follow_up');
          if (online) { setOnlineFee(String(online.fee)); setOnlineDuration(String(online.duration_minutes)); }
          if (inPerson) { setInPersonFee(String(inPerson.fee)); setInPersonDuration(String(inPerson.duration_minutes)); }
          if (followUp) setFollowUpFee(String(followUp.fee));
        }

        if (d.schedule && d.schedule.length > 0) {
           const newSched = { ...schedule };
           // reset all to inactive first
           for (const day of DAYS) newSched[day].active = false;
           d.schedule.forEach((s: any) => {
             const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === s.day_of_week);
             if (dayName) {
               newSched[dayName] = { active: s.is_active, start: s.start_time.slice(0,5), end: s.end_time.slice(0,5) };
             }
           });
           setSchedule(newSched);
        }
        
        if (d.settings) {
          setBufferMins(String(d.settings.buffer_minutes || 5));
          setMaxPatients(String(d.settings.max_patients_per_day || 25));
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function toArray(str: string): string[] {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSaveDetails() {
    setError(''); setSuccessMsg('');
    const specs = toArray(specialisations);
    if (!fullName.trim()) return setError('Full name is required.');
    if (specs.length === 0) return setError('Specialisation is required.');

    setSaving(true);
    const { data, error: err } = await doctorApi.saveProfile({
      fullName: fullName.trim(),
      specialisations: specs,
      email: email.trim() || undefined,
    });
    setSaving(false);

    if (err || !data?.success) return setError(err || data?.message || 'Failed to save profile.');
    if (data.bookingUrl) setBookingUrl(data.bookingUrl);
    mutateUser({ name: fullName.trim() });
    setSuccessMsg('Profile details saved successfully.');
  }

  async function handleSaveFees() {
    setError(''); setSuccessMsg('');
    const types = [];
    if (onlineFee) types.push({ type: 'online', fee: Number(onlineFee), durationMinutes: Number(onlineDuration), isActive: true });
    if (inPersonFee) types.push({ type: 'in_person', fee: Number(inPersonFee), durationMinutes: Number(inPersonDuration), isActive: true });
    if (followUpFee) types.push({ type: 'follow_up', fee: Number(followUpFee), durationMinutes: 15, isActive: true });

    if (types.length === 0) return setError('At least one consultation type with a fee is required.');

    setSaving(true);
    const { data, error: err } = await doctorApi.saveFees({ consultationTypes: types });
    setSaving(false);

    if (err || !data?.success) return setError(err || data?.message || 'Failed to save fees.');
    setSuccessMsg('Consultation fees saved successfully.');
  }

  async function handleSaveSchedule() {
    setError(''); setSuccessMsg('');
    const activeDays = DAYS.filter((d) => schedule[d].active);
    if (activeDays.length === 0) return setError('At least one working day is required.');

    const schedulePayload = activeDays.map((day) => ({
      dayOfWeek: DAY_MAP[day],
      startTime: schedule[day].start,
      endTime: schedule[day].end,
      isActive: true,
      breaks: [],
    }));

    setSaving(true);
    const { data, error: err } = await doctorApi.saveSchedule({
      schedule: schedulePayload,
      bufferMinutes: Number(bufferMins),
      maxPatientsPerDay: Number(maxPatients),
      minBookingAdvanceMinutes: 30,
    });
    setSaving(false);

    if (err || !data?.success) return setError(err || data?.message || 'Failed to save schedule.');
    setSuccessMsg('Schedule saved successfully.');
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div>;

  return (
    <main className="page" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your public profile, fees, and working hours.</p>
      </div>

      {bookingUrl && (
        <div style={{ background: 'var(--surface-raised)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 24 }}>
          <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Your Public Booking Link:</div>
          <a href={`http://${bookingUrl}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            {bookingUrl}
          </a>
        </div>
      )}

      {error && <div className="notice" style={{ marginBottom: 16, background: 'var(--error-bg)', color: 'var(--error)' }}>{error}</div>}
      {successMsg && <div className="notice" style={{ marginBottom: 16, background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>{successMsg}</div>}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        {(['details', 'fees', 'schedule'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(''); setSuccessMsg(''); }}
            style={{ 
              background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', 
              fontWeight: 600, color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">Clinic Details</h2></div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <div className="form-hint">Do not add "Dr." prefix; we add it automatically.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Specialisation</label>
              <select className="input" value={specialisations} onChange={(e) => setSpecialisations(e.target.value)}>
                <option value="">Select Specialisation</option>
                <option value="General Physician">General Physician</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Orthopedist">Orthopedist</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Psychiatrist">Psychiatrist</option>
                <option value="Dentist">Dentist</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={handleSaveDetails} disabled={saving}>Save Details</button>
          </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">Consultation Fees</h2></div>
          {[
            { label: 'Online consultation', fee: onlineFee, setFee: setOnlineFee, dur: onlineDuration, setDur: setOnlineDuration },
            { label: 'In-person consultation', fee: inPersonFee, setFee: setInPersonFee, dur: inPersonDuration, setDur: setInPersonDuration },
            { label: 'Follow-up consultation', fee: followUpFee, setFee: setFollowUpFee, dur: null, setDur: null },
          ].map((ct) => (
            <div key={ct.label} style={{ padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>{ct.label}</div>
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fee (₹)</label>
                  <input className="input" type="number" min={50} max={50000} value={ct.fee} onChange={(e) => ct.setFee(e.target.value)} />
                </div>
                {ct.dur !== null && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Duration (minutes)</label>
                    <input className="input" type="number" min={5} max={120} value={ct.dur} onChange={(e) => ct.setDur!(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={handleSaveFees} disabled={saving}>Save Fees</button>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">Weekly Schedule</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {DAYS.map((day) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  id={`day-${day}`}
                  checked={schedule[day].active}
                  onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], active: e.target.checked } }))}
                />
                <label htmlFor={`day-${day}`} style={{ width: 32, fontWeight: 600, cursor: 'pointer' }}>{day}</label>
                <input
                  className="input"
                  type="time"
                  value={schedule[day].start}
                  disabled={!schedule[day].active}
                  style={{ width: 120 }}
                  onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                />
                <span className="text-muted">to</span>
                <input
                  className="input"
                  type="time"
                  value={schedule[day].end}
                  disabled={!schedule[day].active}
                  style={{ width: 120 }}
                  onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={handleSaveSchedule} disabled={saving}>Save Schedule</button>
          </div>
        </div>
      )}
    </main>
  );
}
