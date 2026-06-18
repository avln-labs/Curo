/**
 * DoctorOnboardingPage — wired to backend API
 *
 * Steps:
 *   1. Clinic Details  → POST /doctors/onboarding/profile
 *   2. Consultation Fees → POST /doctors/onboarding/fees
 *   3. Weekly Schedule → POST /doctors/onboarding/schedule
 *   4. Payment Setup (info only — Razorpay Phase 3)
 *
 * On mount: loads existing profile from GET /doctors/profile to restore progress.
 * If onboarding_step >= 1 and status is 'pending': shows read-only verification banner.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { doctorApi } from '../../../shared/api';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: 'Clinic Details' },
  { n: 2, label: 'Fees' },
  { n: 3, label: 'Schedule' },
  { n: 4, label: 'Payment' },
];

const DAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Stepper({ current, maxDone }: { current: Step; maxDone: number }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div
            className={`step ${current === s.n ? 'active' : maxDone >= s.n ? 'done' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div className="step-bubble">{maxDone >= s.n && current !== s.n ? '✓' : s.n}</div>
            <span className="step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${maxDone > s.n ? 'done' : ''}`} style={{ flex: 1, minWidth: 16 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function VerificationBanner({ status, rejectionReason }: { status: string; rejectionReason?: string }) {
  if (status === 'verified') {
    return (
      <div className="notice notice-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.25rem' }}>✅</span>
        <div>
          <strong>Profile Verified</strong>
          <div style={{ fontSize: '0.8125rem' }}>Your profile has been verified by Curo. Your booking link is now active.</div>
        </div>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="notice" style={{ marginBottom: 20, background: 'var(--error-bg)', border: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: '1.25rem' }}>❌</span>
        <div>
          <strong style={{ color: 'var(--error)' }}>Verification Rejected</strong>
          {rejectionReason && (
            <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>Reason: {rejectionReason}</div>
          )}
          <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>Please update your details below and resubmit.</div>
        </div>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="notice notice-info" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.25rem' }}>⏳</span>
        <div>
          <strong>Awaiting Verification</strong>
          <div style={{ fontSize: '0.8125rem' }}>Your profile is under review. This usually takes 1–2 business days. We'll notify you once approved.</div>
        </div>
      </div>
    );
  }
  return null;
}

export function DoctorOnboardingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [maxDone, setMaxDone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');

  // ── Step 1 fields ────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [qualifications, setQualifications] = useState(''); // comma-separated
  const [specialisations, setSpecialisations] = useState(''); // comma-separated
  const [regNumber, setRegNumber] = useState('');
  const [council, setCouncil] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState(''); // comma-separated
  const [email, setEmail] = useState('');

  // ── Step 2 fields ────────────────────────────────────────────────────────────
  const [onlineFee, setOnlineFee] = useState('');
  const [onlineDuration, setOnlineDuration] = useState('15');
  const [inPersonFee, setInPersonFee] = useState('');
  const [inPersonDuration, setInPersonDuration] = useState('20');
  const [followUpFee, setFollowUpFee] = useState('');

  // ── Step 3 fields ────────────────────────────────────────────────────────────
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

  // ── Load existing profile on mount ───────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data, error: err } = await doctorApi.getProfile();
      if (err || !data?.success) {
        setLoading(false);
        return;
      }

      const d = data.data as Record<string, any>;
      // Restore fields
      if (d.full_name) setFullName(d.full_name);
      if (d.qualifications?.length) setQualifications((d.qualifications as string[]).join(', '));
      if (d.specialisations?.length) setSpecialisations((d.specialisations as string[]).join(', '));
      if (d.registration_number) setRegNumber(d.registration_number);
      if (d.registration_council) setCouncil(d.registration_council);
      if (d.clinic_name) setClinicName(d.clinic_name);
      if (d.city) setCity(d.city);
      if (d.bio) setBio(d.bio);
      if (d.languages?.length) setLanguages((d.languages as string[]).join(', '));
      if (d.email) setEmail(d.email);
      if (d.slug) setBookingUrl(`curo.app/${d.slug}`);

      // Restore consultation type fees
      const consultationTypes = d.consultationTypes as any[] | undefined;
      if (consultationTypes) {
        const online = consultationTypes.find((c: any) => c.type === 'online');
        const inPerson = consultationTypes.find((c: any) => c.type === 'in_person');
        const followUp = consultationTypes.find((c: any) => c.type === 'follow_up');
        if (online) { setOnlineFee(String(online.fee)); setOnlineDuration(String(online.duration_minutes)); }
        if (inPerson) { setInPersonFee(String(inPerson.fee)); setInPersonDuration(String(inPerson.duration_minutes)); }
        if (followUp) setFollowUpFee(String(followUp.fee));
      }

      // Restore verification state
      const vstatus = d.verification_status as string;
      setVerificationStatus(vstatus);
      if (d.rejection_reason) setRejectionReason(d.rejection_reason as string);

      // Restore step progress
      const savedStep = d.onboarding_step as number;
      setMaxDone(savedStep);
      if (savedStep >= 4) {
        setSubmitted(true);
      } else if (savedStep >= 1) {
        // Move to the next incomplete step
        setStep((Math.min(savedStep + 1, 4)) as Step);
      }

      setLoading(false);
    }
    loadProfile();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function toArray(str: string): string[] {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }

  // ── Submit Step 1 ─────────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    setError('');
    const langs = toArray(languages);
    const quals = toArray(qualifications);
    const specs = toArray(specialisations);

    if (!fullName.trim()) return setError('Full name is required.');
    if (quals.length === 0) return setError('At least one qualification is required (e.g. "MBBS, MD").');
    if (specs.length === 0) return setError('At least one specialisation is required.');
    if (!regNumber.trim()) return setError('Registration number is required.');
    if (!council.trim()) return setError('Registration council is required.');
    if (!city.trim()) return setError('City is required.');
    if (langs.length === 0) return setError('At least one language is required.');

    setSaving(true);
    const { data, error: err } = await doctorApi.saveProfile({
      fullName: fullName.trim(),
      qualifications: quals,
      specialisations: specs,
      registrationNumber: regNumber.trim(),
      registrationCouncil: council.trim(),
      clinicName: clinicName.trim() || undefined,
      city: city.trim(),
      bio: bio.trim() || undefined,
      languages: langs,
      email: email.trim() || undefined,
    });
    setSaving(false);

    if (err || !data?.success) {
      return setError(err || data?.message || 'Failed to save profile. Please try again.');
    }

    if (data.bookingUrl) setBookingUrl(data.bookingUrl);
    setVerificationStatus('pending');
    setMaxDone((prev) => Math.max(prev, 1));
    setStep(2);
  }

  // ── Submit Step 2 ─────────────────────────────────────────────────────────────
  async function handleSaveFees() {
    setError('');
    const types = [];
    if (onlineFee) types.push({ type: 'online', fee: Number(onlineFee), durationMinutes: Number(onlineDuration), isActive: true });
    if (inPersonFee) types.push({ type: 'in_person', fee: Number(inPersonFee), durationMinutes: Number(inPersonDuration), isActive: true });
    if (followUpFee) types.push({ type: 'follow_up', fee: Number(followUpFee), durationMinutes: 15, isActive: true });

    if (types.length === 0) return setError('At least one consultation type with a fee is required.');

    setSaving(true);
    const { data, error: err } = await doctorApi.saveFees({ consultationTypes: types });
    setSaving(false);

    if (err || !data?.success) {
      return setError(err || data?.message || 'Failed to save fees. Please try again.');
    }

    setMaxDone((prev) => Math.max(prev, 2));
    setStep(3);
  }

  // ── Submit Step 3 ─────────────────────────────────────────────────────────────
  async function handleSaveSchedule() {
    setError('');
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

    if (err || !data?.success) {
      return setError(err || data?.message || 'Failed to save schedule. Please try again.');
    }

    setMaxDone((prev) => Math.max(prev, 3));
    setStep(4);
  }

  // ── Submit Step 4 (Payment info only, Razorpay Phase 3) ──────────────────────
  async function handleComplete() {
    setSubmitted(true);
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="page" style={{ maxWidth: 720 }}>
        <div className="page-header">
          <h1 className="page-title">Doctor Setup</h1>
        </div>
        <div className="card" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Loading your profile…
        </div>
      </main>
    );
  }

  // ── Submitted / pending verification ─────────────────────────────────────────
  if (submitted) {
    return (
      <main className="page" style={{ maxWidth: 640 }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          {verificationStatus === 'verified' ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2>Profile Verified!</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
                Your profile is verified and your booking link is active. Start accepting patients.
              </p>
            </>
          ) : verificationStatus === 'rejected' ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h2 style={{ color: 'var(--error)' }}>Verification Rejected</h2>
              {rejectionReason && <p className="text-sm" style={{ marginBottom: 12, color: 'var(--error)' }}>Reason: {rejectionReason}</p>}
              <p className="text-muted text-sm" style={{ marginBottom: 24 }}>Please update your details and resubmit.</p>
              <button className="btn btn-primary" onClick={() => { setSubmitted(false); setStep(1); }}>Edit & Resubmit</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <h2>Submitted — Under Review</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
                Your profile is under review by the Curo team. This usually takes 1–2 business days.
                We'll notify you once verified.
              </p>
            </>
          )}

          {bookingUrl && (
            <div
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 20px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: 'var(--primary)',
                marginBottom: 20,
              }}
            >
              {bookingUrl}
            </div>
          )}
          <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Doctor Setup</h1>
        <p className="page-subtitle">Complete all steps to activate your booking link. Progress is saved at each step.</p>
      </div>

      <Stepper current={step} maxDone={maxDone} />

      {/* Show verification banner if previously submitted */}
      {verificationStatus && maxDone >= 1 && (
        <VerificationBanner status={verificationStatus} rejectionReason={rejectionReason} />
      )}

      {error && (
        <div className="notice" style={{ marginBottom: 16, background: 'var(--error-bg)', border: '1px solid #FECACA', color: 'var(--error)', borderRadius: 'var(--radius)' }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Clinic Details ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Clinic Details</h2>
            <span className="text-xs text-muted">Step 1 of 4</span>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As per medical registration" />
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="For notifications" />
            </div>
            <div className="form-group">
              <label className="form-label">Qualifications <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="MBBS, MD (comma-separated)" />
              <div className="form-hint">Separate multiple qualifications with commas</div>
            </div>
            <div className="form-group">
              <label className="form-label">Specialisations <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={specialisations} onChange={(e) => setSpecialisations(e.target.value)} placeholder="General Medicine, Diabetology" />
              <div className="form-hint">Separate multiple specialisations with commas</div>
            </div>
            <div className="form-group">
              <label className="form-label">Registration number <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="MCI/State registration number" />
            </div>
            <div className="form-group">
              <label className="form-label">Registration council <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={council} onChange={(e) => setCouncil(e.target.value)} placeholder="e.g. Maharashtra Medical Council" />
            </div>
            <div className="form-group">
              <label className="form-label">Clinic name <span className="text-muted">(optional)</span></label>
              <input className="input" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Your clinic or hospital name" />
            </div>
            <div className="form-group">
              <label className="form-label">City <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
            </div>
            <div className="form-group">
              <label className="form-label">Languages spoken <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Hindi, English, Marathi" />
              <div className="form-hint">Separate with commas</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio <span className="text-muted">(max 500 chars)</span></label>
            <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} placeholder="Brief introduction for your booking page" />
            <div className="form-hint">{bio.length}/500</div>
          </div>

          {fullName && (
            <div className="notice notice-info" style={{ marginBottom: 16 }}>
              Your booking link: <strong>curo.app/dr-{fullName.toLowerCase().replace(/^dr\.?\s*/i, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className={`btn btn-primary ${saving ? 'loading' : ''}`}
              onClick={handleSaveProfile}
              disabled={saving || !fullName.trim() || !regNumber.trim() || !council.trim()}
            >
              {saving ? '' : 'Save & Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Consultation Fees ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Consultation Fees</h2>
            <span className="text-xs text-muted">Step 2 of 4</span>
          </div>

          {[
            { label: 'Online consultation', fee: onlineFee, setFee: setOnlineFee, dur: onlineDuration, setDur: setOnlineDuration },
            { label: 'In-person consultation', fee: inPersonFee, setFee: setInPersonFee, dur: inPersonDuration, setDur: setInPersonDuration },
            { label: 'Follow-up consultation', fee: followUpFee, setFee: setFollowUpFee, dur: null, setDur: null },
          ].map((ct) => (
            <div key={ct.label} style={{ padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>{ct.label}</div>
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fee (₹) — leave blank to skip</label>
                  <input className="input" type="number" min={50} max={50000} value={ct.fee} onChange={(e) => ct.setFee(e.target.value)} placeholder="e.g. 500" />
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button
              className={`btn btn-primary ${saving ? 'loading' : ''}`}
              onClick={handleSaveFees}
              disabled={saving}
            >
              {saving ? '' : 'Save & Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Weekly Schedule ───────────────────────────────────────── */}
      {step === 3 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Weekly Schedule</h2>
            <span className="text-xs text-muted">Step 3 of 4</span>
          </div>

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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Buffer between appointments (mins)</label>
              <select className="select input" value={bufferMins} onChange={(e) => setBufferMins(e.target.value)}>
                {[0, 5, 10, 15, 20, 30].map((v) => <option key={v} value={v}>{v} min</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max patients per day</label>
              <input className="input" type="number" min={1} max={100} value={maxPatients} onChange={(e) => setMaxPatients(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button
              className={`btn btn-primary ${saving ? 'loading' : ''}`}
              onClick={handleSaveSchedule}
              disabled={saving}
            >
              {saving ? '' : 'Save & Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Payment Setup (info — Razorpay in Phase 3) ───────────── */}
      {step === 4 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payment Setup</h2>
            <span className="text-xs text-muted">Step 4 of 4</span>
          </div>

          <div className="notice notice-info" style={{ marginBottom: 20 }}>
            Razorpay payouts are coming in Phase 3. For now, submitting this step will mark your onboarding as complete and queue your profile for admin verification.
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
            Bank account linking via Razorpay will be available shortly.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={handleComplete}>
              Submit for Verification ✓
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
