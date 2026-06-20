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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { patientApi } from '../../../shared/api';

const GENDER_OPTIONS = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'other',             label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function PatientOnboardingPage() {
  const navigate = useNavigate();
  const { user, verifyOtp } = useAuth();

  const [fullName, setFullName]   = useState('');
  const [gender, setGender]       = useState('');
  const [age, setAge]             = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Suppress unused import warning for verifyOtp
  void verifyOtp;

  async function handleSubmit() {
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!gender) return setError('Please select your gender.');
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return setError('Please enter a valid age (1–120).');
    }

    setSaving(true);
    const { data, error: apiErr } = await patientApi.completeOnboarding({
      fullName: fullName.trim(),
      gender,
      age: ageNum,
    });
    setSaving(false);

    if (apiErr || !data?.success) {
      return setError(apiErr || data?.message || 'Failed to save profile. Please try again.');
    }

    // Update localStorage user with new name so the sidebar reflects it immediately
    const stored = localStorage.getItem('curo.user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.name = fullName.trim();
        parsed.onboardingComplete = true;
        parsed.gender = gender;
        parsed.age = ageNum;
        localStorage.setItem('curo.user', JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }

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

          {/* Age */}
          <div className="form-group">
            <label className="form-label">
              Age <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="patient-age"
              className="input"
              type="number"
              placeholder="e.g. 28"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{ maxWidth: 140 }}
            />
            <div className="form-hint" style={{ marginTop: 4 }}>
              Age can only be set once and cannot be changed later.
            </div>
          </div>

          {/* Notice */}
          <div
            className="notice notice-info"
            style={{ marginBottom: 24, fontSize: '0.8125rem' }}
          >
            📱 Your mobile number is: <strong>+91 {user?.mobile}</strong>
            <br />
            You can update your name and email in Settings anytime.
          </div>

          <button
            id="patient-onboarding-submit"
            className={`btn btn-primary btn-lg ${saving ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={saving}
            style={{ width: '100%' }}
          >
            {saving ? '' : 'Save & Continue →'}
          </button>
        </div>
      </div>
    </main>
  );
}
