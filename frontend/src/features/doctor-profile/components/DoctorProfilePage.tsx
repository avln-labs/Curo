import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { doctorApi, api } from '../../../shared/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function DoctorProfilePage() {
  const { user, mutateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'fees' | 'schedule' | 'integrations'>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Profile Fields ──
  const [fullName, setFullName] = useState(user?.name || '');
  const [specialisations, setSpecialisations] = useState('');
  const [email, setEmail] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [signatureBase64, setSignatureBase64] = useState<string>('');
  const [hasSignature, setHasSignature] = useState(false);

  // ── Fee Fields ──
  const [onlineFee, setOnlineFee] = useState('');
  const [onlineDuration, setOnlineDuration] = useState('15');
  const [inPersonFee, setInPersonFee] = useState('');
  const [inPersonDuration, setInPersonDuration] = useState('20');
  const [followUpFee, setFollowUpFee] = useState('');

  // ── Schedule Fields ──
  const [schedule, setSchedule] = useState<Record<string, { active: boolean; start: string; end: string; hasBreak: boolean; breakStart: string; breakEnd: string }>>({
    Mon: { active: true, start: '09:00', end: '17:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    Tue: { active: true, start: '09:00', end: '17:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    Wed: { active: true, start: '09:00', end: '17:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    Thu: { active: true, start: '09:00', end: '17:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    Fri: { active: true, start: '09:00', end: '17:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    Sat: { active: true, start: '09:00', end: '13:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
  });
  const [bufferMins, setBufferMins] = useState('5');
  const [maxPatients, setMaxPatients] = useState('25');

  // ── Integration Fields ──
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
        if (d.signature_url) setHasSignature(true);
        if (d.upi_id) setUpiId(d.upi_id);
        if (d.upi_qr_url) setUpiQrUrl(d.upi_qr_url);

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
               const hasBreak = s.breaks && s.breaks.length > 0;
               newSched[dayName] = { 
                 active: s.is_active, 
                 start: s.start_time.slice(0,5), 
                 end: s.end_time.slice(0,5),
                 hasBreak,
                 breakStart: hasBreak ? s.breaks[0].start_time.slice(0,5) : '13:00',
                 breakEnd: hasBreak ? s.breaks[0].end_time.slice(0,5) : '14:00'
               };
             }
           });
           setSchedule(newSched);
        }
        
        if (d.settings) {
          setBufferMins(String(d.settings.buffer_minutes || 5));
          setMaxPatients(String(d.settings.max_patients_per_day || 25));
        }
      }
      
      // Load Google status
      const { data: gRes } = await api.get<{ success: boolean; connected: boolean }>('/doctors/google/status');
      if (gRes?.success) {
        setGoogleConnected(gRes.connected);
      }

      setLoading(false);
    }
    loadProfile();
  }, []);

  function toArray(str: string): string[] {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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
      signatureBase64: signatureBase64 || undefined,
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

    const schedulePayload = activeDays.map((day) => {
      const dayData = schedule[day];
      const breaks = dayData.hasBreak ? [{ startTime: dayData.breakStart, endTime: dayData.breakEnd }] : [];
      return {
        dayOfWeek: DAY_MAP[day],
        startTime: dayData.start,
        endTime: dayData.end,
        isActive: true,
        breaks,
      };
    });

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

  const handleSaveUpi = async () => {
    setSavingUpi(true);
    setUpiSuccess('');
    const { data: res, error: err } = await doctorApi.updateUpi({ upiId, upiQrUrl });
    setSavingUpi(false);
    if (res?.success) {
      setUpiSuccess('UPI Details updated successfully.');
    } else {
      setError(err || 'Failed to update UPI details.');
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    const { data: res, error: err } = await api.get<{ success: boolean; url: string }>('/doctors/google/auth');
    setGoogleLoading(false);
    if (res?.success && res.url) {
      window.location.href = res.url;
    } else {
      setError(err || 'Failed to initiate Google OAuth flow.');
    }
  };

  const handleDisconnectGoogle = async () => {
    setGoogleLoading(true);
    const { data: res, error: err } = await api.delete<{ success: boolean }>('/doctors/google/disconnect');
    setGoogleLoading(false);
    if (res?.success) {
      setGoogleConnected(false);
      alert('Google Calendar disconnected successfully.');
    } else {
      setError(err || 'Failed to disconnect Google Calendar.');
    }
  };

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
        {(['details', 'fees', 'schedule', 'integrations'] as const).map(tab => (
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
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">E-Signature</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input type="file" accept="image/png, image/jpeg" className="input" onChange={handleSignatureUpload} />
                {hasSignature && !signatureBase64 && (
                  <span className="text-sm text-muted">✅ Signature already uploaded</span>
                )}
                {signatureBase64 && (
                  <img src={signatureBase64} alt="Signature Preview" style={{ height: 40, objectFit: 'contain' }} />
                )}
              </div>
              <div className="form-hint">Upload a PNG or JPEG of your signature to automatically embed in prescriptions.</div>
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
              <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--border)', opacity: schedule[day].active ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: 80, fontWeight: 600, cursor: 'pointer', fontSize: '1.05rem' }}>
                    <input
                      type="checkbox"
                      checked={schedule[day].active}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], active: e.target.checked } }))}
                      style={{ width: 18, height: 18 }}
                    />
                    {day}
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 50 }}>Shift</div>
                    <input
                      className="input"
                      type="time"
                      value={schedule[day].start}
                      disabled={!schedule[day].active}
                      style={{ width: 110, padding: '6px 10px' }}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                    />
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>to</span>
                    <input
                      className="input"
                      type="time"
                      value={schedule[day].end}
                      disabled={!schedule[day].active}
                      style={{ width: 110, padding: '6px 10px' }}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                    />
                  </div>
                  
                  {schedule[day].active && !schedule[day].hasBreak && (
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--primary)', fontWeight: 500 }}
                      onClick={() => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], hasBreak: true } }))}
                    >
                      + Add Break
                    </button>
                  )}
                </div>
                
                {schedule[day].active && schedule[day].hasBreak && (
                  <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 108 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-raised)', padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 50 }}>Break</div>
                      <input
                        className="input"
                        type="time"
                        value={schedule[day].breakStart}
                        style={{ width: 110, padding: '6px 10px' }}
                        onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], breakStart: e.target.value } }))}
                      />
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>to</span>
                      <input
                        className="input"
                        type="time"
                        value={schedule[day].breakEnd}
                        style={{ width: 110, padding: '6px 10px' }}
                        onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], breakEnd: e.target.value } }))}
                      />
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: 4, minHeight: 'auto', color: 'var(--error)', marginLeft: 8 }} 
                        onClick={() => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], hasBreak: false } }))}
                        title="Remove Break"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={handleSaveSchedule} disabled={saving}>Save Schedule</button>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* UPI Settings */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">UPI Payment Setup</h2>
              <p className="text-muted text-sm">Patients will see these details during the booking process to make payments.</p>
            </div>
            <div style={{ padding: 24 }}>
              {upiSuccess && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: 12, borderRadius: 8, marginBottom: 16 }}>{upiSuccess}</div>}
              <div className="form-group">
                <label className="form-label">UPI ID / VPA</label>
                <input type="text" className="input" placeholder="e.g. yourname@okicici" value={upiId} onChange={e => setUpiId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">UPI QR Code Image</label>
                <input type="file" accept="image/*" className="input" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      alert('File size must be less than 2MB');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setUpiQrUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
                <div className="form-hint">Upload your QR code image (max 2MB). It will be saved securely.</div>
              </div>
              {upiQrUrl && (
                <div style={{ marginTop: 16, border: '1px solid var(--border)', padding: 16, borderRadius: 8, display: 'inline-block' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>QR Preview:</div>
                  <img src={upiQrUrl} alt="UPI QR Preview" style={{ width: 150, height: 150, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
              <div style={{ marginTop: 24 }}>
                <button className={`btn btn-primary ${savingUpi ? 'loading' : ''}`} onClick={handleSaveUpi} disabled={savingUpi}>Save UPI Details</button>
              </div>
            </div>
          </div>

          {/* Google Calendar */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Google Calendar Integration</h2>
              <p className="text-muted text-sm">Connect your Google account to automatically create calendar events and generate Google Meet links for online consultations.</p>
            </div>
            <div style={{ padding: 24 }}>
              {new URLSearchParams(window.location.search).get('google') === 'success' && (
                <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: 12, borderRadius: 8, marginBottom: 16 }}>Google Calendar connected successfully!</div>
              )}
              {new URLSearchParams(window.location.search).get('google') === 'failed' && (
                <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: 12, borderRadius: 8, marginBottom: 16 }}>Failed to connect Google Calendar. Please try again.</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-raised)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>Google Account</div>
                  <div style={{ fontSize: '0.85rem', color: googleConnected ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {googleConnected ? '✓ Connected to Google Calendar' : 'Not connected'}
                  </div>
                </div>
                {googleConnected ? (
                  <button className={`btn btn-secondary btn-sm ${googleLoading ? 'loading' : ''}`} onClick={handleDisconnectGoogle} disabled={googleLoading}>Disconnect</button>
                ) : (
                  <button className={`btn btn-primary btn-sm ${googleLoading ? 'loading' : ''}`} onClick={handleConnectGoogle} disabled={googleLoading}>Connect Google Account</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
