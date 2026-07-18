/**
 * PatientOnboardingPage
 *
 * Shown once to new patients immediately after signup.
 * Collects: Full Name, Gender, Age.
 * Once submitted, these fields are locked:
 *   - Gender and Age become read-only after this screen.
 *   - Full name remains editable in the profile settings.
 *
 * Redirects to /records on success.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { patientApi } from '../../../shared/api';

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];

export function PatientOnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, mutateUser } = useAuth();

  const [fullName, setFullName]   = useState('');
  const [gender, setGender]       = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handleSubmit() {
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!gender) return setError('Please select your gender.');
    if (!dateOfBirth) return setError('Please enter your date of birth.');

    setSaving(true);
    const { data, error: apiErr } = await patientApi.completeOnboarding({
      fullName: fullName.trim(),
      gender,
      dateOfBirth,
    });
    setSaving(false);

    if (apiErr || !data?.success) {
      return setError(apiErr || data?.message || 'Failed to save profile. Please try again.');
    }

    mutateUser({
      name: fullName.trim(),
      onboardingComplete: true,
      gender,
      dateOfBirth,
    });

    navigate('/records', { replace: true });
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 32px 20px',
            background: 'linear-gradient(135deg, var(--primary-muted) 0%, var(--surface) 100%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🙋</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
            Welcome to CURO!
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Let's set up your health profile. This only takes a moment.
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '28px 32px' }}>
          {error && (
            <div
              style={{
                background: 'var(--error-bg)',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                color: 'var(--error)',
                fontSize: '0.875rem',
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">
              Full name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="patient-name"
              className="input"
              type="text"
              placeholder="e.g. Rohan Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Gender */}
          <div className="form-group">
            <label className="form-label">
              Gender <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              {GENDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`gender-${opt.value}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    border: `1px solid ${gender === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: gender === opt.value ? 'var(--primary-muted)' : 'var(--surface-raised)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: gender === opt.value ? 600 : 400,
                    color: gender === opt.value ? 'var(--primary)' : 'var(--text-primary)',
                    transition: 'all 150ms',
                    userSelect: 'none',
                  }}
                >
                  <input
                    id={`gender-${opt.value}`}
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={() => setGender(opt.value)}
                    style={{ display: 'none' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="form-hint" style={{ marginTop: 6 }}>
              Gender can only be set once and cannot be changed later.
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label className="form-label">
              Date of Birth <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              className="input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <div className="form-hint" style={{ marginTop: 4 }}>
              Date of birth can only be set once and cannot be changed later.
            </div>
          </div>

          {/* Notice */}
          <div
            className="notice notice-info"
            style={{ marginBottom: 16, fontSize: '0.8125rem' }}
          >
            📱 Your mobile number is: <strong>+91 {user?.mobile}</strong>
            <br />
            You can update your name and email in Settings anytime.
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              id="terms" 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <label htmlFor="terms" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
              I agree to the <a href="#" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</a>. I consent to the processing of my health information as per the Digital Personal Data Protection Act, 2023.
            </label>
          </div>

          <button
            id="patient-onboarding-submit"
            className={`btn btn-primary btn-lg ${saving ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={saving || !termsAccepted}
            style={{ width: '100%' }}
          >
            {saving ? '' : 'Save & Continue →'}
          </button>
        </div>
      </div>
    </main>
  );
}
