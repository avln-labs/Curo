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
    title: 'Independent Doctor',
    desc: 'Your frictionless clinical workspace.',
    bullets: ['AI pre-consult briefs', '20-second prescriptions', 'Respect for your time'],
  },
  PATIENT: {
    icon: '🙋',
    title: 'Patient',
    desc: 'Your longitudinal health timeline.',
    bullets: ['Book in seconds', 'Prescriptions via WhatsApp', 'Secure health records'],
  },
} as const;

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
  const [phase, setPhase] = useState<Phase>('role');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'DOCTOR') navigate('/dashboard');
      else if (user.role === 'PATIENT' && user.onboardingComplete === false) navigate('/patient-onboarding');
      else navigate('/records');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/health')
      .then((r) => setBackendOnline(r.ok))
      .catch(() => setBackendOnline(false));
  }, []);

  function selectRole(role: Role) {
    setSelectedRole(role);
    setError('');
    setPhase('auth');
  }

  async function handleSendOtp() {
    if (!selectedRole) return;
    setError('');
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
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
      setError('Please enter the 6-digit OTP.');
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
    setSuccessMsg(result.isNewUser ? 'Welcome to Curo.' : 'Welcome back.');
    setPhase('success');
    
    setTimeout(() => {
      if (selectedRole === 'DOCTOR') navigate('/dashboard');
      else if (result.isNewUser || result.needsOnboarding) navigate('/patient-onboarding');
      else navigate('/records');
    }, 1500);
  }

  function handleOtpInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6) setTimeout(() => handleVerifyOtp(), 100);
  }

  function resetToRole() {
    setPhase('role');
    setSelectedRole(null);
    setMobile('');
    setOtp('');
    setError('');
  }

  return (
    <div className="landing-bg">
      <nav className="landing-nav">
        <div className="landing-logo">CURO.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {backendOnline !== null && (
            <span style={{ fontSize: '0.8rem', color: backendOnline ? 'var(--success)' : 'var(--error)' }}>
              {backendOnline ? '● System Online' : '● Demo Mode'}
            </span>
          )}
          {phase !== 'role' && (
            <button className="landing-nav-link" onClick={resetToRole}>← Restart</button>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        {phase === 'role' && (
          <>
            <h1 className="landing-h1">
              The <span>Frictionless</span><br />
              Clinical Operating System.
            </h1>
            <p className="landing-sub">
              We respect your time above all else. Zero-friction booking, AI pre-consult briefs, and prescriptions in 20 seconds.
            </p>
            
            <div className="role-selector">
              {(['DOCTOR', 'PATIENT'] as Role[]).map((r) => (
                <div 
                  key={r}
                  className={`role-card ${selectedRole === r ? 'selected' : ''}`}
                  onClick={() => selectRole(r)}
                >
                  <span className="role-icon">{ROLE_CONFIG[r].icon}</span>
                  <h3 className="role-title">{ROLE_CONFIG[r].title}</h3>
                  <p className="role-desc">{ROLE_CONFIG[r].desc}</p>
                  <ul className="role-bullets">
                    {ROLE_CONFIG[r].bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {phase === 'auth' && selectedRole && (
          <div className="auth-box">
            <h2 className="auth-h2">{ROLE_CONFIG[selectedRole].title} Access</h2>
            <p className="auth-sub">Enter your mobile number to sign in or create a new workspace.</p>
            
            {error && <div className="auth-error">{error}</div>}
            
            <label className="auth-label">Mobile Number</label>
            <input
              type="tel"
              className="auth-input"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              autoFocus
            />
            
            <button 
              className="auth-btn primary" 
              onClick={handleSendOtp}
              disabled={loading || mobile.replace(/\D/g, '').length !== 10}
            >
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </div>
        )}

        {phase === 'otp' && (
          <div className="auth-box" style={{ textAlign: 'center' }}>
            <h2 className="auth-h2">Verify Access</h2>
            <p className="auth-sub">We sent a secure code to<br/><strong>{maskedMobile}</strong></p>
            
            {error && <div className="auth-error" style={{ textAlign: 'left' }}>{error}</div>}
            
            <input
              ref={otpRef}
              type="tel"
              className="auth-input"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
              placeholder="000000"
              value={otp}
              onChange={(e) => handleOtpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              autoFocus
            />
            
            <button 
              className="auth-btn"
              onClick={() => { setPhase('auth'); setOtp(''); setError(''); }}
              disabled={loading}
              style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
          </div>
        )}

        {phase === 'success' && (
          <div className="auth-box" style={{ textAlign: 'center' }}>
            <div className="success-message">{successMsg}</div>
            <p className="auth-sub">Preparing your secure environment...</p>
            <div className="success-loader">
              <div className="success-loader-fill" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
