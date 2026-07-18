import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { doctorApi } from '../../../shared/api';
import '../../auth/landing.css'; 

type Step = 1 | 2 | 3 | 4 | 5;

const DAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PG_DEGREES_MAP: Record<string, string[]> = {
  'MBBS': ['MD', 'MS', 'DNB', 'DM', 'MCh', 'Fellowship', 'Diploma'],
  'BDS': ['MDS', 'Fellowship', 'Diploma'],
  'BAMS': ['MD (Ayurveda)', 'MS (Ayurveda)', 'Diploma'],
  'BHMS': ['MD (Homeopathy)', 'Diploma']
};

const ALL_LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali'];

function MultiSelectDropdown({ options, selected, onChange, placeholder }: { options: string[], selected: string[], onChange: (val: string[]) => void, placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div 
        className="auth-input" 
        style={{ cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 48, alignItems: 'center' }}
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 && <span style={{ color: 'var(--text-tertiary)' }}>{placeholder}</span>}
        {selected.map(s => (
          <span key={s} style={{ background: 'var(--primary-muted)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 16, fontSize: '0.85rem' }}>
            {s} 
            <span style={{ marginLeft: 6, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onChange(selected.filter(x => x !== s)); }}>×</span>
          </span>
        ))}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', zIndex: 10, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 4 }}>
          {options.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter(x => x !== opt));
              }} />
              <span style={{ fontSize: '0.95rem' }}>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function MinimalStepper({ current, maxDone }: { current: Step; maxDone: number }) {
  const steps = 5;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            width: 40,
            borderRadius: 2,
            background: i + 1 <= current ? 'var(--primary)' : 'var(--border)',
            transition: 'background 0.3s ease'
          }}
        />
      ))}
    </div>
  );
}

function VerificationBanner({ status, rejectionReason }: { status: string; rejectionReason?: string }) {
  if (status === 'verified') {
    return (
      <div className="auth-box" style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 className="auth-h2">Profile Verified</h2>
        <p className="auth-sub" style={{ marginBottom: 24 }}>Your profile has been verified by Curo. Your booking link is now active.</p>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="auth-box" style={{ textAlign: 'center', marginTop: 40, borderColor: 'var(--error)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 className="auth-h2" style={{ color: 'var(--error)' }}>Verification Rejected</h2>
        {rejectionReason && <p className="auth-sub" style={{ color: 'var(--error)' }}>Reason: {rejectionReason}</p>}
        <p className="auth-sub" style={{ marginBottom: 24 }}>Please update your details and resubmit.</p>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="auth-box" style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 className="auth-h2">Awaiting Verification</h2>
        <p className="auth-sub" style={{ marginBottom: 24 }}>Your profile is under review. This usually takes 1–2 business days. We'll notify you once approved.</p>
      </div>
    );
  }
  return null;
}

export function DoctorOnboardingPage() {
  const { user, mutateUser } = useAuth();
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
  const [fullName, setFullName] = useState(user?.name || '');
  const [specialisations, setSpecialisations] = useState(''); 
  const [email, setEmail] = useState('');

  // ── Step 2 fields ────────────────────────────────────────────────────────────
  const [experienceYears, setExperienceYears] = useState('');
  const [ugDegree, setUgDegree] = useState('');
  const [otherDegrees, setOtherDegrees] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  // ── Step 3 fields ────────────────────────────────────────────────────────────
  const [onlineFee, setOnlineFee] = useState('');
  const [onlineDuration, setOnlineDuration] = useState('15');
  const [inPersonFee, setInPersonFee] = useState('');
  const [inPersonDuration, setInPersonDuration] = useState('20');

  // ── Step 4 fields ────────────────────────────────────────────────────────────
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

  // ── Step 5 fields ────────────────────────────────────────────────────────────
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');

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
      if (d.full_name) setFullName(d.full_name);
      if (d.specialisations?.length) setSpecialisations((d.specialisations as string[]).join(', '));
      if (d.email) setEmail(d.email);
      if (d.slug) setBookingUrl(`curo.app/dr/${d.slug}`);
      if (d.upi_id) setUpiId(d.upi_id);
      if (d.upi_qr_url) setUpiQrUrl(d.upi_qr_url);
      
      if (d.experience_years) setExperienceYears(String(d.experience_years));
      if (d.languages?.length) setLanguages(d.languages as string[]);
      if (d.bio) setBio(d.bio);

      if (d.qualifications?.length > 0) {
        const quals = d.qualifications as string[];
        const ugOptions = ['MBBS', 'BDS', 'BAMS', 'BHMS'];
        const ug = quals.find(q => ugOptions.includes(q)) || quals[0] || '';
        setUgDegree(ug);
        const rest = quals.filter(q => q !== ug);
        setOtherDegrees(rest);
      }

      const consultationTypes = d.consultationTypes as any[] | undefined;
      if (consultationTypes) {
        const online = consultationTypes.find((c: any) => c.type === 'online');
        const inPerson = consultationTypes.find((c: any) => c.type === 'in_person');
        if (online) { setOnlineFee(String(online.fee)); setOnlineDuration(String(online.duration_minutes)); }
        if (inPerson) { setInPersonFee(String(inPerson.fee)); setInPersonDuration(String(inPerson.duration_minutes)); }
      }

      const vstatus = d.verification_status as string;
      setVerificationStatus(vstatus);
      if (d.rejection_reason) setRejectionReason(d.rejection_reason as string);

      const savedStep = d.onboarding_step as number;
      setMaxDone(savedStep);
      if (savedStep >= 5) {
        setSubmitted(true);
      } else if (savedStep >= 1) {
        setStep((Math.min(savedStep + 1, 5)) as Step);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function toArray(str: string): string[] {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSaveStep1() {
    setError('');
    const specs = toArray(specialisations);

    if (!fullName.trim()) return setError('Full name is required.');
    if (specs.length === 0) return setError('Specialisation is required.');

    setMaxDone((prev) => Math.max(prev, 1));
    setStep(2);
  }

  async function handleSaveStep2() {
    setError('');
    if (!ugDegree) return setError('Undergraduate Degree is required.');
    
    let allQuals = [ugDegree];
    if (otherDegrees.length > 0) {
      allQuals = [...allQuals, ...otherDegrees];
    }

    setSaving(true);
    const { data, error: err } = await doctorApi.saveProfile({
      fullName: fullName.trim(),
      specialisations: toArray(specialisations),
      email: email.trim() || undefined,
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
      qualifications: allQuals,
      languages: languages.length > 0 ? languages : undefined,
      bio: bio.trim() || undefined
    });
    setSaving(false);

    if (err || !data?.success) return setError(err || data?.message || 'Failed to save profile.');

    if (data.bookingUrl) setBookingUrl(data.bookingUrl);
    mutateUser({ name: fullName.trim() });
    setVerificationStatus('pending');
    setMaxDone((prev) => Math.max(prev, 2));
    setStep(3);
  }

  async function handleSaveFees() {
    setError('');
    const types = [];
    if (onlineFee) types.push({ type: 'online', fee: Number(onlineFee), durationMinutes: Number(onlineDuration), isActive: true });
    if (inPersonFee) types.push({ type: 'in_person', fee: Number(inPersonFee), durationMinutes: Number(inPersonDuration), isActive: true });

    if (types.length === 0) return setError('At least one consultation fee is required.');

    setSaving(true);
    const { data, error: err } = await doctorApi.saveFees({ consultationTypes: types });
    setSaving(false);

    if (err || !data?.success) return setError(err || data?.message || 'Failed to save fees.');

    setMaxDone((prev) => Math.max(prev, 3));
    setStep(4);
  }

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

    if (err || !data?.success) return setError(err || data?.message || 'Failed to save schedule.');

    setMaxDone((prev) => Math.max(prev, 4));
    setStep(5);
  }

  async function handleComplete() {
    setSaving(true);
    setError('');
    const { data, error: err } = await doctorApi.completeOnboarding({ upiId, upiQrUrl });
    setSaving(false);

    if (err || !data?.success) return setError(err || data?.message || 'Failed to complete onboarding.');

    mutateUser({ needsOnboarding: false });
    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="landing-bg" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Preparing your workspace...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="landing-bg" style={{ alignItems: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 640, width: '100%' }}>
          <VerificationBanner status={verificationStatus} rejectionReason={rejectionReason} />
          {verificationStatus === 'rejected' && (
            <div style={{ textAlign: 'center' }}>
              <button className="auth-btn" onClick={() => { setSubmitted(false); setStep(1); }}>
                Edit & Resubmit
              </button>
            </div>
          )}
          {verificationStatus !== 'rejected' && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              {bookingUrl && (
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Your booking link</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--primary)' }}>{bookingUrl}</div>
                </div>
              )}
              <Link to="/dashboard" className="auth-btn primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '16px 32px' }}>
                Go to Dashboard →
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="landing-bg" style={{ alignItems: 'center', padding: '60px 24px' }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        
        <MinimalStepper current={step} maxDone={maxDone} />

        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <div className="auth-box">
            <h2 className="auth-h2">Let's set up your clinic</h2>
            <p className="auth-sub">Basic details for your patients to know who they are booking with.</p>

            <label className="auth-label">Full Name</label>
            <input className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Suresh Kumar" />

            <label className="auth-label">Specialisation</label>
            <select className="auth-input" value={specialisations} onChange={(e) => setSpecialisations(e.target.value)}>
              <option value="">Select Specialisation</option>
              <option value="General Physician">General Physician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Neurologist">Neurologist</option>
            </select>

            <label className="auth-label">Email (Optional)</label>
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="For notifications" />

            <button className="auth-btn primary" onClick={handleSaveStep1} disabled={saving}>
              {saving ? 'Saving...' : 'Next Step →'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="auth-box">
            <h2 className="auth-h2">Professional Details</h2>
            <p className="auth-sub">Build trust with patients by completing your profile.</p>

            <label className="auth-label">Undergraduate Degree *</label>
            <select className="auth-input" value={ugDegree} onChange={(e) => {
              setUgDegree(e.target.value);
              setOtherDegrees([]); // Reset PG when UG changes
            }}>
              <option value="">Select Degree</option>
              <option value="MBBS">MBBS</option>
              <option value="BDS">BDS</option>
              <option value="BAMS">BAMS</option>
              <option value="BHMS">BHMS</option>
            </select>

            {ugDegree && PG_DEGREES_MAP[ugDegree] && (
              <>
                <label className="auth-label">Postgraduate & Super Speciality Degrees (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {PG_DEGREES_MAP[ugDegree].map(deg => (
                    <label key={deg} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={otherDegrees.includes(deg)} 
                        onChange={e => {
                          if (e.target.checked) setOtherDegrees(prev => [...prev, deg]);
                          else setOtherDegrees(prev => prev.filter(d => d !== deg));
                        }} 
                      />
                      {deg}
                    </label>
                  ))}
                </div>
              </>
            )}

            <label className="auth-label">Years of Experience (Optional)</label>
            <input className="auth-input" type="number" min="0" max="100" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="e.g. 15" />
            
            <label className="auth-label">Languages Spoken (Optional)</label>
            <MultiSelectDropdown 
              options={ALL_LANGUAGES} 
              selected={languages} 
              onChange={setLanguages} 
              placeholder="Select Languages..." 
            />

            <label className="auth-label">Professional Bio (Optional)</label>
            <textarea className="auth-input" style={{ minHeight: 100, resize: 'vertical' }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief description of your expertise and background..." />

            <div style={{ display: 'flex', gap: 16 }}>
              <button className="auth-btn" onClick={() => setStep(1)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Back
              </button>
              <button className="auth-btn primary" onClick={handleSaveStep2} disabled={saving}>
                {saving ? 'Saving...' : 'Next Step →'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="auth-box">
            <h2 className="auth-h2">Consultation Fees</h2>
            <p className="auth-sub">Set your standard fees. Leave blank if not applicable.</p>

            <label className="auth-label">Online Consultation Fee (₹)</label>
            <input className="auth-input" type="number" value={onlineFee} onChange={(e) => setOnlineFee(e.target.value)} placeholder="e.g. 500" />
            
            <label className="auth-label">In-Person Consultation Fee (₹)</label>
            <input className="auth-input" type="number" value={inPersonFee} onChange={(e) => setInPersonFee(e.target.value)} placeholder="e.g. 800" />

            <div style={{ display: 'flex', gap: 16 }}>
              <button className="auth-btn" onClick={() => setStep(2)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Back
              </button>
              <button className="auth-btn primary" onClick={handleSaveFees} disabled={saving}>
                {saving ? 'Saving...' : 'Next Step →'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="auth-box">
            <h2 className="auth-h2">Your Availability</h2>
            <p className="auth-sub">When do you see patients?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {DAYS.map((day) => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 80, cursor: 'pointer', fontWeight: 600 }}>
                    <input type="checkbox" checked={schedule[day].active} onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], active: e.target.checked } }))} />
                    {day}
                  </label>
                  <input className="auth-input" type="time" style={{ marginBottom: 0, padding: 8, flex: 1 }} value={schedule[day].start} disabled={!schedule[day].active} onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))} />
                  <span style={{ color: 'var(--text-tertiary)' }}>to</span>
                  <input className="auth-input" type="time" style={{ marginBottom: 0, padding: 8, flex: 1 }} value={schedule[day].end} disabled={!schedule[day].active} onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <button className="auth-btn" onClick={() => setStep(3)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Back
              </button>
              <button className="auth-btn primary" onClick={handleSaveSchedule} disabled={saving}>
                {saving ? 'Saving...' : 'Next Step →'}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="auth-box">
            <h2 className="auth-h2">Payment Setup</h2>
            <p className="auth-sub">Patients will use these details to pay during booking.</p>

            <label className="auth-label">UPI ID / VPA (Optional for now)</label>
            <input className="auth-input" type="text" placeholder="e.g. yourname@okicici" value={upiId} onChange={e => setUpiId(e.target.value)} />

            <div style={{ display: 'flex', gap: 16 }}>
              <button className="auth-btn" onClick={() => setStep(4)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Back
              </button>
              <button className="auth-btn primary" onClick={handleComplete} disabled={saving}>
                {saving ? 'Finishing...' : 'Complete Setup ✓'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
