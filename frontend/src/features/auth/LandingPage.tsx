import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { API_BASE } from '../../../shared/api';
import { AnimatedFAQ } from './components/AnimatedFAQ';
import './landing.css';

type Role = 'DOCTOR' | 'PATIENT';
type AuthMode = 'login' | 'signup';
type Phase = 'role' | 'auth' | 'otp' | 'success';

const ROLE_CONFIG = {
  DOCTOR: {
    icon: 'Dr.',
    title: 'I am a Doctor',
    desc: 'Reclaim 2 hours daily with AI briefs and 20-second prescriptions.',
    bullets: ['Stop writing the same prescription 50 times', 'Know patient history before they enter', 'Frictionless video consults'],
  },
  PATIENT: {
    icon: 'Pt.',
    title: 'I am a Patient',
    desc: 'Never lose a medical record again. Book and consult instantly.',
    bullets: ['Instant, no-friction booking', 'Prescriptions straight to WhatsApp', 'Your complete health timeline'],
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
    fetch(`${API_BASE}/health`)
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
              Modern Healthcare,<br />
              <span>Without the Friction.</span>
            </h1>
            <p className="landing-sub">
              For independent doctors who want their time back, and patients who want their health records organized.
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
      </section>

      {phase === 'role' && (
        <>
          <section className="marketing-section alt">
            <div className="split-layout">
              <div className="split-content">
                <div className="marketing-badge">For Doctors</div>
                <h2 className="marketing-h2">Stop fighting your software. Start practicing medicine.</h2>
                <p className="marketing-sub">
                  Generic clinic software slows you down with endless clicks and bloated features. Curo is built differently. We handle the admin so you can handle the patient.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="visual-mockup-item">
                    <div>
                      <strong style={{ display: 'block' }}>AI Pre-Consult Briefs</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Know exactly why they're here before they even sit down.</span>
                    </div>
                  </div>
                  <div className="visual-mockup-item">
                    <div>
                      <strong style={{ display: 'block' }}>20-Second Prescriptions</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Lightning-fast autocomplete built for the real world.</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="split-visual" style={{ background: 'linear-gradient(135deg, var(--surface), var(--primary-muted))' }}>
                <div style={{ padding: '24px', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px' }}>BRIEFING</div>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>Chief Complaint: Dengue</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Patient presents with severe joint pain and high fever for 3 days. Previous history of malaria.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="marketing-section">
            <div className="split-layout reverse">
              <div className="split-visual" style={{ background: 'linear-gradient(135deg, var(--surface), var(--warning-bg))' }}>
                <div style={{ padding: '24px', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 'bold', marginBottom: '8px' }}>RECORD SAVED</div>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>Prescription: Paracetamol 500mg</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Available instantly via WhatsApp and securely stored in your timeline.</div>
                </div>
              </div>
              <div className="split-content">
                <div className="marketing-badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>For Patients</div>
                <h2 className="marketing-h2">Your health history, finally in one place.</h2>
                <p className="marketing-sub">
                  No more carrying heavy physical files or scrolling endlessly through WhatsApp to find that one prescription from 6 months ago. 
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="visual-mockup-item">
                    <div>
                      <strong style={{ display: 'block' }}>Instant Access</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>View your entire medical history on any device, anywhere.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="marketing-section alt" style={{ textAlign: 'center' }}>
            <h2 className="marketing-h2">How it Works</h2>
            <p className="marketing-sub" style={{ margin: '0 auto 48px' }}>
              We've stripped away everything that doesn't add value. What remains is a perfectly optimized 3-step loop.
            </p>
            <div className="process-grid">
              <div className="process-step">
                <span className="process-icon" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>01</span>
                <h3 className="process-h3">Book</h3>
                <p className="process-p">Patients book via a frictionless public link. No app downloads required.</p>
              </div>
              <div className="process-step">
                <span className="process-icon" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>02</span>
                <h3 className="process-h3">Consult</h3>
                <p className="process-p">Doctors review AI briefs and join a secure Google Meet with one click.</p>
              </div>
              <div className="process-step">
                <span className="process-icon" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>03</span>
                <h3 className="process-h3">Prescribe</h3>
                <p className="process-p">Prescriptions are generated in seconds and sent directly to the patient's phone.</p>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="landing-hero" style={{ padding: phase === 'role' ? '0' : '24px 24px 80px', flex: phase === 'role' ? 'none' : '1' }}>

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
              style={{ marginBottom: '16px' }}
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
            
            <div style={{ display: 'flex', gap: 16, marginTop: 16, width: '100%' }}>
              <button 
                className="auth-btn"
                onClick={() => { setPhase('auth'); setOtp(''); setError(''); }}
                disabled={loading}
                style={{ flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button 
                className="auth-btn primary"
                onClick={handleVerifyOtp}
                disabled={loading || otp.replace(/\D/g, '').length < 6}
                style={{ flex: 1 }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}
        {phase === 'success' && (
        <section className="landing-hero" style={{ justifyContent: 'center' }}>
          <div className="success-message">{successMsg}</div>
          <div className="success-loader">
            <div className="success-loader-fill" />
          </div>
        </section>
      )}
      </section>

      {/* Render AnimatedFAQ below the Hero section */}
      {phase === 'role' && <AnimatedFAQ />}

      {phase === 'role' && (
        <footer className="landing-footer">
          <div className="landing-footer-content">
            <p>
              Built by <a href="https://sufyaanahmed.com/" target="_blank" rel="noreferrer">Sufyaan Ahmed</a>, Founder & Developer.
            </p>
            <p style={{ marginTop: '8px' }}>
              Connect on <a href="https://www.linkedin.com/in/sufyaan-ahmed/" target="_blank" rel="noreferrer">LinkedIn</a>.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
