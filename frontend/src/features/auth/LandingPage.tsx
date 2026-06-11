import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './landing.css';

type Role = 'DOCTOR' | 'PATIENT';
type AuthMode = 'login' | 'signup';
type Phase = 'role' | 'auth' | 'otp' | 'success';

const ROLE_CONFIG = {
  DOCTOR: {
    icon: '🩺',
    title: 'I\'m a Doctor',
    desc: 'Independent practice or small clinic',
    bullets: ['Digital prescriptions', 'Smart booking page', 'AI pre-consult briefs'],
  },
  PATIENT: {
    icon: '🙋',
    title: 'I\'m a Patient',
    desc: 'Book appointments, view records',
    bullets: ['Book in 60 seconds', 'Your health timeline', 'Prescriptions on WhatsApp'],
  },
} as const;

const FEATURES = [
  '⚡ OTP sign-in', '📋 Digital prescriptions', '✦ AI summaries',
  '📅 Smart scheduling', '🔒 Private & secure', '💬 WhatsApp updates',
];

function OtpDots({ value }: { value: string }) {
  return (
    <div className="otp-dots">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`otp-dot ${i < value.length ? 'filled' : ''}`} />
      ))}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, sendOtp, verifyOtp } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [phase, setPhase] = useState<Phase>('role');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'DOCTOR' ? '/dashboard' : '/records');
    }
  }, [isAuthenticated, user, navigate]);

  // Probe backend health
  useEffect(() => {
    fetch('http://localhost:4000/api/v1/health')
      .then((r) => r.ok ? setBackendOnline(true) : setBackendOnline(false))
      .catch(() => setBackendOnline(false));
  }, []);

  function selectRole(role: Role) {
    setSelectedRole(role);
    setError('');
  }

  function proceedToAuth() {
    if (!selectedRole) return;
    setPhase('auth');
    setError('');
  }

  async function handleSendOtp() {
    if (!selectedRole) return;
    setError('');
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    const result = await sendOtp(cleaned, selectedRole);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setMaskedMobile(result.message);
    setPhase('otp');
    setTimeout(() => otpRef.current?.focus(), 100);
  }

  async function handleVerifyOtp() {
    if (!selectedRole) return;
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    const cleaned = mobile.replace(/\D/g, '');
    const result = await verifyOtp(cleaned, otp, selectedRole);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSuccessMsg(result.isNewUser ? 'Account created! Welcome to CURO 🎉' : 'Welcome back! ');
    setPhase('success');
    // Navigate after 1.6s (bar animation)
    setTimeout(() => {
      navigate(selectedRole === 'DOCTOR' ? '/dashboard' : '/records');
    }, 1700);
  }

  function handleOtpInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6) setTimeout(() => handleVerifyOtp(), 200);
  }

  function resetToRole() {
    setPhase('role');
    setSelectedRole(null);
    setMobile('');
    setOtp('');
    setError('');
    setName('');
  }

  return (
    <div className="landing-bg">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">C</div>
          <span className="landing-logo-name">CURO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {backendOnline !== null && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: '0.7rem', color: backendOnline ? '#15803D' : '#D97706',
              background: backendOnline ? '#F0FDF4' : '#FFFBEB',
              border: `1px solid ${backendOnline ? '#BBF7D0' : '#FDE68A'}`,
              borderRadius: 99, padding: '3px 8px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: backendOnline ? '#15803D' : '#D97706', display: 'inline-block' }} />
              API {backendOnline ? 'online' : 'offline (demo mode)'}
            </span>
          )}
          {phase !== 'role' && (
            <button className="landing-nav-link" onClick={resetToRole}>← Back</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        {/* Badge */}
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          Now in early access · Pune, India
        </div>

        {/* H1 */}
        <h1 className="landing-h1">
          Private clinical workspace<br />
          for <span>independent doctors</span>
        </h1>

        <p className="landing-sub">
          Zero-friction booking, AI pre-consult briefs, digital prescriptions,
          and a longitudinal health thread for every patient.
        </p>

        {/* Feature pills */}
        <div className="feature-pills">
          {FEATURES.map((f) => (
            <span key={f} className="feature-pill">{f}</span>
          ))}
        </div>

        {/* ── Phase: ROLE SELECTION ── */}
        {phase === 'role' && (
          <>
            <div className="role-selector">
              {(['DOCTOR', 'PATIENT'] as Role[]).map((role) => {
                const cfg = ROLE_CONFIG[role];
                const isSelected = selectedRole === role;
                const isOther = selectedRole !== null && !isSelected;
                return (
                  <div
                    key={role}
                    className={`role-card ${isSelected ? 'selected' : ''} ${isOther ? 'other' : ''}`}
                    onClick={() => selectRole(role)}
                  >
                    <div className="role-check">✓</div>
                    <div className="role-icon-wrap">{cfg.icon}</div>
                    <div className="role-card-title">{cfg.title}</div>
                    <div className="role-card-desc">{cfg.desc}</div>
                    <ul className="role-bullets">
                      {cfg.bullets.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>

            {selectedRole && (
              <div className="auth-panel" style={{ marginTop: 24 }}>
                <button
                  className="auth-btn"
                  onClick={proceedToAuth}
                  style={{ maxWidth: 320, margin: '0 auto' }}
                >
                  Continue as {selectedRole === 'DOCTOR' ? 'Doctor' : 'Patient'} →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Phase: AUTH FORM ── */}
        {phase === 'auth' && selectedRole && (
          <div className="auth-panel">
            <div className="auth-card">
              <button className="auth-back-btn" onClick={resetToRole}>
                ← {ROLE_CONFIG[selectedRole].icon} {ROLE_CONFIG[selectedRole].title}
              </button>

              {/* Login / Sign up tabs */}
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('login'); setError(''); }}
                >
                  Sign in
                </button>
                <button
                  className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('signup'); setError(''); }}
                >
                  Create account
                </button>
              </div>

              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 4 }}>
                {authMode === 'login' ? 'Welcome back' : `Join as ${selectedRole === 'DOCTOR' ? 'a Doctor' : 'a Patient'}`}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: 20 }}>
                {authMode === 'login'
                  ? "Enter your registered mobile number to receive an OTP."
                  : "We'll send you an OTP to verify your number. No password needed."}
              </p>

              {error && <div className="auth-error">{error}</div>}

              {authMode === 'signup' && (
                <div style={{ marginBottom: 14 }}>
                  <label className="auth-label">Full name</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder={selectedRole === 'DOCTOR' ? 'Dr. Arun Sharma' : 'Rohan Kumar'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div style={{ marginBottom: 4 }}>
                <label className="auth-label">Mobile number</label>
                <input
                  className="auth-input"
                  type="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  inputMode="numeric"
                />
              </div>

              {!backendOnline && (
                <p style={{ fontSize: '0.7rem', color: '#D97706', marginBottom: 8 }}>
                  Demo mode: backend offline. Use mobile <strong>9876543210</strong> (doctor) or <strong>9123456789</strong> (patient).
                </p>
              )}

              <button
                className={`auth-btn ${loading ? 'loading' : ''}`}
                onClick={handleSendOtp}
                disabled={loading || mobile.length < 10 || (authMode === 'signup' && !name)}
              >
                {loading ? '' : 'Send OTP →'}
              </button>

              <p className="auth-hint" style={{ marginTop: 12 }}>
                {authMode === 'login'
                  ? <>New to CURO? <button onClick={() => setAuthMode('signup')} style={{ background: 'none', border: 'none', color: '#0F766E', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>Create account</button></>
                  : <>Already have an account? <button onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: '#0F766E', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>Sign in</button></>
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Phase: OTP ── */}
        {phase === 'otp' && selectedRole && (
          <div className="auth-panel">
            <div className="auth-card">
              <button className="auth-back-btn" onClick={() => { setPhase('auth'); setOtp(''); setError(''); }}>
                ← Change number
              </button>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📱</div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 4 }}>Enter your OTP</h2>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                  Sent to <strong>+91 {mobile}</strong>
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}

              {!backendOnline && (
                <div className="auth-notice">
                  <span>💡</span>
                  <span>Demo mode — use OTP <strong>123456</strong></span>
                </div>
              )}

              <input
                ref={otpRef}
                className="auth-input otp-input"
                type="text"
                inputMode="numeric"
                placeholder="——————"
                value={otp}
                onChange={(e) => handleOtpInput(e.target.value)}
                maxLength={6}
              />

              <OtpDots value={otp} />

              <button
                className={`auth-btn ${loading ? 'loading' : ''}`}
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                style={{ marginTop: 8 }}
              >
                {loading ? '' : 'Verify & Continue →'}
              </button>

              <p className="auth-hint" style={{ marginTop: 12 }}>
                Didn't receive it?{' '}
                <button
                  onClick={() => { setOtp(''); handleSendOtp(); }}
                  style={{ background: 'none', border: 'none', color: '#0F766E', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ── Phase: SUCCESS ── */}
        {phase === 'success' && (
          <div className="auth-panel">
            <div className="auth-card">
              <div className="success-overlay">
                <span className="success-emoji">🎉</span>
                <div className="success-title">{successMsg}</div>
                <div className="success-sub">
                  Taking you to your {selectedRole === 'DOCTOR' ? 'workspace' : 'health portal'}…
                </div>
                <div className="redirect-bar">
                  <div className="redirect-bar-fill" />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Stats bar */}
      <footer className="landing-stats">
        {[
          { value: '2,847', label: 'Doctors registered' },
          null,
          { value: '18,421', label: 'Patients served' },
          null,
          { value: '₹4.2Cr', label: 'Consultations billed' },
          null,
          { value: '4.9★', label: 'Average rating' },
        ].map((item, i) =>
          item === null
            ? <div key={i} className="landing-stat-divider" />
            : (
              <div key={i} className="landing-stat">
                <div className="landing-stat-value">{item.value}</div>
                <div className="landing-stat-label">{item.label}</div>
              </div>
            )
        )}
      </footer>
    </div>
  );
}
