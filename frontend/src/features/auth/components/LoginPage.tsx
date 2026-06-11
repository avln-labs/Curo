import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Role = 'DOCTOR' | 'PATIENT';

export function LoginPage() {
  const [role, setRole] = useState<Role>('DOCTOR');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function sendOtp() {
    if (!mobile) return;
    setLoading(true);
    setTimeout(() => { setOtpSent(true); setLoading(false); }, 800);
  }

  function verify() {
    setLoading(true);
    setTimeout(() => { navigate('/'); }, 600);
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">C</div>

        <h1 style={{ fontSize: '1.25rem', marginBottom: 4 }}>Sign in to CURO</h1>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
          OTP-based sign-in. No password required.
        </p>

        {/* Role toggle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: 3,
            marginBottom: 20,
          }}
        >
          {(['DOCTOR', 'PATIENT'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '7px 0',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: role === r ? 'var(--surface)' : 'transparent',
                color: role === r ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: role === r ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms',
              }}
            >
              {r === 'DOCTOR' ? '🩺 Doctor' : '👤 Patient'}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Mobile number</label>
          <input
            className="input"
            type="tel"
            placeholder="98765 43210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={otpSent}
          />
        </div>

        {!otpSent ? (
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={sendOtp}
            disabled={!mobile || loading}
          >
            {loading ? 'Sending OTP…' : 'Send OTP →'}
          </button>
        ) : (
          <>
            <div className="notice notice-info" style={{ marginBottom: 16 }}>
              OTP sent to +91 {mobile}. Use <strong>123456</strong> for demo.
            </div>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                className="input"
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                style={{ letterSpacing: '0.2em', fontSize: '1.2rem', textAlign: 'center' }}
              />
            </div>
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={verify}
              disabled={otp.length < 4 || loading}
            >
              {loading ? 'Verifying…' : 'Verify & Sign in →'}
            </button>
            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop: 8 }}
              onClick={() => { setOtpSent(false); setOtp(''); }}
            >
              Change number
            </button>
          </>
        )}

        <p
          className="text-xs text-muted"
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          Demo: tap "Send OTP" → enter any 6 digits → Sign in
        </p>
      </div>
    </div>
  );
}
