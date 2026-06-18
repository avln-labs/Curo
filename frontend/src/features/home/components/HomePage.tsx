import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export function HomePage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  const doctorCards = [
    { label: 'Doctor Dashboard',   desc: "Today's schedule, stats & slot grid",            to: '/dashboard',         icon: '⊞' },
    { label: 'Start Consultation', desc: 'Open workspace with patient snapshot & AI summary', to: '/consultations',     icon: '♥' },
    { label: 'Prescriptions',      desc: 'Issue digital prescriptions, send via WhatsApp',  to: '/prescriptions',     icon: '✦' },
    { label: 'Doctor Setup',       desc: '4-step onboarding wizard — clinic to payments',    to: '/doctor-onboarding', icon: '✚' },
  ];

  const patientCards = [
    { label: 'Book Appointment',   desc: 'Patient-facing booking flow with payment',        to: '/booking/details',   icon: '📅' },
    { label: 'Health Records',     desc: 'Past records, uploaded reports, share links',     to: '/records',           icon: '◈' },
  ];

  const cards = isDoctor ? doctorCards : patientCards;

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">
          Welcome{(user as any)?.fullName ? `, ${(user as any).fullName}` : ''} 👋
        </h1>
        <p className="page-subtitle">
          {isDoctor
            ? 'Your clinical workspace is ready.'
            : 'Your health portal is ready.'}
        </p>
      </div>

      {/* Quick nav cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-4)' }}>
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-3)',
              boxShadow: 'var(--shadow)',
              textDecoration: 'none',
              transition: 'border-color 150ms, box-shadow 150ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(15,118,110,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{card.label}</div>
            <div className="text-xs text-muted">{card.desc}</div>
          </Link>
        ))}
      </div>

      {/* Onboarding nudge for new doctors */}
      {isDoctor && (user as any)?.needsOnboarding && (
        <div className="card" style={{ borderLeft: '3px solid var(--primary)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Complete your profile setup</div>
            <div className="text-sm text-muted">Finish the 4-step onboarding to activate your booking link and start accepting patients.</div>
          </div>
          <Link to="/doctor-onboarding" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Go to Setup →
          </Link>
        </div>
      )}
    </main>
  );
}
