import { useState } from 'react';
import { Link } from 'react-router-dom';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: 'Clinic Details' },
  { n: 2, label: 'Consultation Fees' },
  { n: 3, label: 'Schedule & Slots' },
  { n: 4, label: 'Payment Setup' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Stepper({ current }: { current: Step }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className={`step ${current === s.n ? 'active' : current > s.n ? 'done' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="step-bubble">
              {current > s.n ? '✓' : s.n}
            </div>
            <span className="step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${current > s.n ? 'done' : ''}`} style={{ flex: 1, minWidth: 16 }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function DoctorOnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);

  // Step 1 state
  const [fullName, setFullName] = useState('Dr. Arun Sharma');
  const [specialisation, setSpecialisation] = useState('General Medicine');
  const [regNumber, setRegNumber] = useState('MH-2010-45821');
  const [council, setCouncil] = useState('Maharashtra Medical Council');
  const [clinicName, setClinicName] = useState('Sharma Clinic');
  const [city, setCity] = useState('Pune');
  const [bio, setBio] = useState('MBBS, MD. 14 years of practice in general medicine with a focus on preventive care and chronic disease management.');
  const [languages, setLanguages] = useState('Hindi, English, Marathi');

  // Step 2 state
  const [onlineFee, setOnlineFee] = useState('500');
  const [onlineDuration, setOnlineDuration] = useState('15');
  const [inPersonFee, setInPersonFee] = useState('700');
  const [inPersonDuration, setInPersonDuration] = useState('20');
  const [followUpFee, setFollowUpFee] = useState('300');

  // Step 3 state
  const [schedule, setSchedule] = useState({
    Mon: { active: true, start: '09:00', end: '13:00' },
    Tue: { active: true, start: '09:00', end: '13:00' },
    Wed: { active: true, start: '09:00', end: '13:00' },
    Thu: { active: true, start: '09:00', end: '17:00' },
    Fri: { active: true, start: '09:00', end: '17:00' },
    Sat: { active: true, start: '09:00', end: '12:00' },
  } as Record<string, { active: boolean; start: string; end: string }>);
  const [bufferMins, setBufferMins] = useState('5');
  const [maxPatients, setMaxPatients] = useState('25');

  // Step 4 state
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pan, setPan] = useState('');

  if (submitted) {
    return (
      <main className="page" style={{ maxWidth: 640 }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2>Setup complete!</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
            Your booking link is now live. Share it with patients.
          </p>
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
            curo.app/dr-arun-sharma
          </div>
          <Link to="/doctor-dashboard" className="btn btn-primary btn-lg">Go to Dashboard →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Doctor Setup</h1>
        <p className="page-subtitle">Complete all 4 steps to activate your booking link. Progress is saved at each step.</p>
      </div>

      <Stepper current={step} />

      {/* Step 1: Clinic Details */}
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
              <label className="form-label">Specialisation <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={specialisation} onChange={(e) => setSpecialisation(e.target.value)} placeholder="e.g. General Medicine" />
            </div>
            <div className="form-group">
              <label className="form-label">Registration number <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="MCI/State registration" />
            </div>
            <div className="form-group">
              <label className="form-label">Registration council <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" value={council} onChange={(e) => setCouncil(e.target.value)} placeholder="e.g. Maharashtra Medical Council" />
            </div>
            <div className="form-group">
              <label className="form-label">Clinic name</label>
              <input className="input" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
            </div>
            <div className="form-group">
              <label className="form-label">Languages spoken</label>
              <input className="input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="e.g. Hindi, English" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio <span className="text-muted">(max 500 chars)</span></label>
            <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} />
            <div className="form-hint">{bio.length}/500</div>
          </div>

          {fullName && regNumber && (
            <div className="notice notice-info" style={{ marginBottom: 16 }}>
              Your booking link will be: <strong>curo.app/dr-{fullName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^dr-/,'dr-')}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!fullName || !regNumber}>
              Next: Fees →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Fees */}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Schedule →</button>
          </div>
        </div>
      )}

      {/* Step 3: Schedule */}
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
            <button className="btn btn-primary" onClick={() => setStep(4)}>Next: Payment →</button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payment Setup</h2>
            <span className="text-xs text-muted">Step 4 of 4</span>
          </div>

          <div className="notice notice-info" style={{ marginBottom: 20 }}>
            Bank account is validated via penny-drop. Payouts are T+2 business days. Platform fee: 2.5% per transaction (min ₹10).
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Bank account number</label>
              <input className="input" type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Enter account number" />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC code</label>
              <input className="input" type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
            <div className="form-group">
              <label className="form-label">PAN number</label>
              <input className="input" type="text" value={pan} onChange={(e) => setPan(e.target.value)} placeholder="e.g. ABCDE1234F" style={{ fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} />
              <div className="form-hint">Required for TDS compliance</div>
            </div>
            <div className="form-group">
              <label className="form-label">GST number <span className="text-muted">(optional)</span></label>
              <input className="input" type="text" placeholder="Required if annual billing > ₹20L" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setSubmitted(true)}>
              Complete Setup ✓
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
