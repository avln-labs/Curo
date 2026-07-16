import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../shared/api';
import { BookingWizard } from './BookingWizard';

interface DoctorProfile {
  id: string;
  slug: string;
  full_name: string;
  qualifications: string[];
  specialisations: string[];
  city: string;
  clinic_name?: string;
  bio?: string;
  languages: string[];
  experience_years?: number;
  verification_status?: string;
}

export function DoctorPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!slug) return navigate('/');
      try {
        const res = await api.get<{ success: boolean; data: DoctorProfile; error?: { message: string } }>(`/doctors/${slug}/public`);
        if (res.data?.success) {
          setDoctor(res.data.data);
        } else {
          setError(res.data?.error?.message || 'Doctor not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="landing-bg" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading doctor profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="landing-bg" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <h2 className="auth-h2">Profile Not Found</h2>
          <p className="auth-sub" style={{ marginBottom: 24 }}>{error || 'This doctor profile is unavailable.'}</p>
          <button className="auth-btn primary" onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </div>
    );
  }

  // Apple Liquid Glass inline styling
  const glassPanelStyle = {
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
    borderRadius: '24px',
    padding: '32px',
    position: 'sticky' as const,
    top: 40,
  };

  return (
    <div className="landing-bg" style={{ padding: '60px 24px', minHeight: '100vh', alignItems: 'center' }}>
      <div style={{ maxWidth: 1000, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 40, alignItems: 'flex-start' }}>

        {/* Left Panel: Doctor Info (Liquid Glass) */}
        <div style={glassPanelStyle}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--primary-light)', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: 'var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              {doctor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            
            {doctor.verification_status === 'verified' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(93, 184, 114, 0.1)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(93, 184, 114, 0.2)' }}>
                <span style={{ fontSize: '0.85rem' }}>✅</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>Medical Registration Verified</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 8, color: 'var(--text-primary)' }}>
              Dr. {doctor.full_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{doctor.specialisations.join(', ')}</span>
              {(doctor.experience_years ?? 0) > 0 && (
                <>
                  <span style={{ color: 'var(--border-strong)' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{doctor.experience_years} Years Experience</span>
                </>
              )}
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📍</span> {doctor.clinic_name || 'Independent Practice'}, {doctor.city}
            </p>
          </div>

          {doctor.bio && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{doctor.bio}</p>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Education</h3>
            {doctor.qualifications && doctor.qualifications.length > 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500 }}>
                {doctor.qualifications.join(', ')}
              </p>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not specified</p>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Languages</h3>
            {doctor.languages && doctor.languages.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {doctor.languages.map(lang => (
                  <span key={lang} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)', padding: '4px 12px', borderRadius: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Not specified</p>
            )}
          </div>

        </div>

        {/* Right Panel: Booking Wizard */}
        <div style={{ ...glassPanelStyle, padding: 0, overflow: 'hidden' }}>
          <BookingWizard doctor={doctor} />
        </div>

      </div>
    </div>
  );
}
