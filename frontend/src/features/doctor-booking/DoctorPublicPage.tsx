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
  upi_id?: string;
  upi_qr_url?: string;
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading doctor profile...</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Profile Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error || 'This doctor profile is unavailable.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32, alignItems: 'flex-start' }}>

        {/* Left Panel: Doctor Info */}
        <div className="card" style={{ position: 'sticky', top: 40 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-muted)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>
              {doctor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Dr. {doctor.full_name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{doctor.qualifications.join(', ')}</p>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Specialisations</h3>
            <div className="pill-list">
              {doctor.specialisations.map(s => <span key={s} className="pill">{s}</span>)}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Languages</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{doctor.languages.join(', ')}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Clinic & Location</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{doctor.clinic_name || 'Independent Practice'}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{doctor.city}</p>
          </div>

          {doctor.bio && (
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.95rem' }}>{doctor.bio}</p>
            </div>
          )}
        </div>

        {/* Right Panel: Booking Wizard */}
        <div>
          <BookingWizard doctor={doctor} />
        </div>

      </div>
    </div>
  );
}
