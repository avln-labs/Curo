import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Gender = 'Male' | 'Female' | 'Other';

function save(data: Record<string, unknown>) {
  const prev = JSON.parse(localStorage.getItem('curo.booking') || '{}');
  localStorage.setItem('curo.booking', JSON.stringify({ ...prev, ...data }));
}

function BookingSteps({ current }: { current: number }) {
  const steps = ['Your Details', 'Symptoms', 'Select Slot', 'Payment'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === current;
        const isDone = n < current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: n < steps.length ? 1 : 'unset' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--surface-raised)',
                color: isDone || isActive ? 'white' : 'var(--text-tertiary)',
                border: `2px solid ${isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-strong)'}`,
              }}>
                {isDone ? '✓' : n}
              </div>
              {n <= current && (
                <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {label}
                </span>
              )}
            </div>
            {n < steps.length && (
              <div style={{ flex: 1, height: 1, background: isDone ? 'var(--success)' : 'var(--border)', margin: '0 10px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BookingDetails() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  function sendOtp() { if (mobile.length >= 10) setOtpSent(true); }
  function verifyOtp() { if (otp.length >= 4) setVerified(true); }

  function next() {
    save({ patientName: name, age, gender, mobile, email });
    navigate('/booking/symptoms');
  }

  return (
    <div className="booking-shell">
      <div className="booking-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo">C</div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CURO</span>
        </div>
        <span className="text-sm text-muted">Book with Dr. Arun Sharma</span>
      </div>

      <div className="booking-container">
        <BookingSteps current={1} />
        <h2 style={{ marginBottom: 4 }}>Your details</h2>
        <p className="text-sm text-muted" style={{ marginBottom: 24 }}>Returning patient? Enter your mobile to auto-fill.</p>

        <div className="form-group">
          <label className="form-label">Full name <span style={{ color: 'var(--error)' }}>*</span></label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan Kumar" />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Age <span style={{ color: 'var(--error)' }}>*</span></label>
            <input className="input" type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 34" />
          </div>
          <div className="form-group">
            <label className="form-label">Gender <span style={{ color: 'var(--error)' }}>*</span></label>
            <select className="select input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mobile <span style={{ color: 'var(--error)' }}>*</span></label>
          <div className="input-group">
            <input
              className="input"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number"
              disabled={verified}
            />
            {!verified && (
              <button className="btn btn-secondary" onClick={sendOtp} disabled={mobile.length < 10}>
                {otpSent ? 'Resend' : 'Send OTP'}
              </button>
            )}
          </div>
          {verified && <div className="form-hint" style={{ color: 'var(--success)' }}>✓ Mobile verified</div>}
        </div>

        {otpSent && !verified && (
          <div className="form-group">
            <label className="form-label">Enter OTP</label>
            <div className="input-group">
              <input className="input" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} style={{ letterSpacing: '0.15em', textAlign: 'center' }} />
              <button className="btn btn-primary" onClick={verifyOtp}>Verify</button>
            </div>
            <div className="form-hint">Demo: enter any 4+ digits</div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email <span className="text-muted">(optional)</span></label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="for booking confirmation" />
        </div>

        <div style={{ paddingBottom: 80 }} />
      </div>

      <div className="sticky-cta">
        <button className="btn btn-primary btn-lg btn-full" onClick={next} disabled={!name || !age || !mobile || (!verified && otpSent)}>
          Continue →
        </button>
      </div>
    </div>
  );
}
