/**
 * PatientProfilePage
 *
 * Displays and allows editing of the patient's health profile.
 *
 * Restriction rules enforced on both frontend and backend:
 *   - Gender: read-only if gender_locked = true (set during onboarding)
 *   - Age: read-only if age_locked = true (set during onboarding)
 *   - Email: can only be changed once every 14 days
 *   - Phone: displayed read-only (phone changes via admin request only)
 *   - Name: always editable
 *   - Blood group and allergies: always editable
 */

import { useState, useEffect } from 'react';
import { patientApi } from '../../../shared/api';

const GENDER_LABELS: Record<string, string> = {
  male:              'Male',
  female:            'Female',
  other:             'Other',
  prefer_not_to_say: 'Prefer not to say',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface PatientProfile {
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  allergies: string[];
  mobile: string;
  email: string | null;
  email_changed_at: string | null;
  mobile_changed_at: string | null;
  gender_locked: boolean;
  age_locked: boolean;
  onboarding_complete: boolean;
  created_at: string;
}

function daysUntilContactChange(changedAt: string | null, cooldownDays = 14): number | null {
  if (!changedAt) return null;
  const last = new Date(changedAt);
  const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince >= cooldownDays) return null;
  return Math.ceil(cooldownDays - daysSince);
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies]   = useState<string[]>([]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender]         = useState('');

  useEffect(() => {
    async function load() {
      const { data, error: err } = await patientApi.getMe();
      if (err || !data?.success) {
        setError(err || 'Failed to load profile.');
        setLoading(false);
        return;
      }
      const p = data.data as unknown as PatientProfile;
      setProfile(p);
      setFullName(p.full_name || '');
      setEmail(p.email || '');
      setBloodGroup(p.blood_group || '');
      setAllergies(p.allergies || []);
      setDateOfBirth(p.date_of_birth || '');
      setGender(p.gender || '');
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setError('');
    setSuccessMsg('');

    const body: Record<string, unknown> = {};
    if (fullName.trim() !== profile.full_name) body.fullName = fullName.trim();
    if (email.trim() !== (profile.email || '')) body.email = email.trim() || undefined;
    if (bloodGroup !== (profile.blood_group || '')) body.bloodGroup = bloodGroup || undefined;
    if (JSON.stringify(allergies) !== JSON.stringify(profile.allergies)) body.allergies = allergies;

    // Only include age/gender if not locked
    if (!profile.age_locked && dateOfBirth && profile.date_of_birth !== dateOfBirth) body.dateOfBirth = dateOfBirth;
    if (!profile.gender_locked && gender && gender !== profile.gender) body.gender = gender;

    if (Object.keys(body).length === 0) {
      return setError('No changes to save.');
    }

    setSaving(true);
    const { data, error: apiErr } = await patientApi.updateProfile(body);
    setSaving(false);

    if (apiErr || !data?.success) {
      return setError(apiErr || data?.message || 'Update failed.');
    }

    setSuccessMsg('Profile updated successfully.');
    // Reload profile to get updated lock states
    const { data: fresh } = await patientApi.getMe();
    if (fresh?.success) {
      const p = fresh.data as unknown as PatientProfile;
      setProfile(p);
      setAllergies(p.allergies || []);
    }
  }

  function addAllergy() {
    const a = allergyInput.trim();
    if (a && !allergies.includes(a)) {
      setAllergies([...allergies, a]);
    }
    setAllergyInput('');
  }

  function removeAllergy(a: string) {
    setAllergies(allergies.filter((x) => x !== a));
  }

  if (loading) {
    return (
      <main className="page">
        <div className="page-header"><h1 className="page-title">My Profile</h1></div>
        <div className="card" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Loading profile…
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page">
        <div className="page-header"><h1 className="page-title">My Profile</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--error)' }}>{error || 'Profile not found.'}</p>
        </div>
      </main>
    );
  }

  const emailCooldownDays = daysUntilContactChange(profile.email_changed_at);

  return (
    <main className="page" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--primary-muted)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--primary)',
            }}
          >
            {profile.full_name ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {profile.full_name || 'My Profile'}
            </h1>
            <p className="page-subtitle">
              CURO Patient · Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              {profile.date_of_birth && ` · Age: ${calculateAge(profile.date_of_birth)} yrs`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--error-bg)',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            color: 'var(--error)',
            fontSize: '0.875rem',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}
      {successMsg && (
        <div className="notice notice-success" style={{ marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      {/* Basic Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2 className="card-title">Basic information</h2>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              id="profile-fullname"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile number</label>
            <input
              className="input"
              value={`+91 ${profile.mobile}`}
              readOnly
              style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
            />
            <div className="form-hint">Phone changes are handled by Curo support.</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Date of Birth
              {profile.age_locked && (
                <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  · locked after setup
                </span>
              )}
            </label>
            <input
              className="input"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              readOnly={profile.age_locked}
              max={new Date().toISOString().split('T')[0]}
              style={profile.age_locked ? { background: 'var(--surface-raised)', color: 'var(--text-secondary)', cursor: 'not-allowed' } : undefined}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Gender
              {profile.gender_locked && (
                <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  · locked after setup
                </span>
              )}
            </label>
            {profile.gender_locked ? (
              <input
                className="input"
                value={GENDER_LABELS[profile.gender || ''] || profile.gender || '—'}
                readOnly
                style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
              />
            ) : (
              <select className="select input" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select gender</option>
                {Object.entries(GENDER_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h2 className="card-title">Contact information</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            id="profile-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={emailCooldownDays !== null}
            placeholder="you@example.com"
            style={emailCooldownDays !== null ? { background: 'var(--surface-raised)', color: 'var(--text-secondary)', cursor: 'not-allowed' } : undefined}
          />
          {emailCooldownDays !== null ? (
            <div className="form-hint" style={{ color: 'var(--warning)' }}>
              ⏳ Email was recently changed. You can update it again in {emailCooldownDays} day{emailCooldownDays !== 1 ? 's' : ''}.
            </div>
          ) : (
            <div className="form-hint">Email can be changed once every 14 days.</div>
          )}
        </div>
      </div>

      {/* Health Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2 className="card-title">Health information</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Blood group</label>
          <select
            id="profile-blood-group"
            className="select input"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            <option value="">Not specified</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Known allergies</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              id="profile-allergy-input"
              className="input"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              placeholder="e.g. Penicillin"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={addAllergy} type="button">+ Add</button>
          </div>
          {allergies.length > 0 ? (
            <div className="pill-list">
              {allergies.map((a) => (
                <span
                  key={a}
                  className="pill"
                  style={{ background: 'var(--error-bg)', borderColor: '#FECACA', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {a}
                  <button
                    onClick={() => removeAllergy(a)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem', padding: '0 2px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No allergies recorded.</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          id="profile-save-btn"
          className={`btn btn-primary ${saving ? 'loading' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '' : 'Save Changes'}
        </button>
      </div>
    </main>
  );
}
