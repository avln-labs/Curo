import { Link } from 'react-router-dom';

const APPOINTMENTS = [
  { id: 'a1', time: '09:00 AM', name: 'Rohan Kumar',  initials: 'RK', complaint: 'Recurring fever',     type: 'Online',    status: 'Confirmed',  statusClass: 'badge-success' },
  { id: 'a2', time: '10:00 AM', name: 'Ankit Joshi',  initials: 'AJ', complaint: 'Back pain',           type: 'In-person', status: 'Confirmed',  statusClass: 'badge-success' },
  { id: 'a3', time: '11:00 AM', name: 'Karan Desai',  initials: 'KD', complaint: 'Digestive complaint', type: 'Online',    status: 'Confirmed',  statusClass: 'badge-success' },
];

export function HomePage() {
  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">CURO — Clinical Workspace</h1>
        <p className="page-subtitle">A calm workspace for independent doctors and small clinics.</p>
      </div>

      {/* Quick nav cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-4)' }}>
        {[
          { label: 'Doctor Dashboard', desc: 'View today\'s schedule, stats, and slot grid', to: '/doctor-dashboard', icon: '⊞' },
          { label: 'Start Consultation', desc: 'Open workspace with patient snapshot & AI summary', to: '/consultations', icon: '♥' },
          { label: 'Book Appointment', desc: 'Patient-facing booking flow with payment', to: '/booking/details', icon: '📅' },
          { label: 'Prescriptions', desc: 'Issue digital prescriptions, send via WhatsApp', to: '/prescriptions', icon: '✦' },
          { label: 'Health Records', desc: 'Patient records, uploaded reports, share links', to: '/records', icon: '◈' },
          { label: 'Doctor Setup', desc: '4-step onboarding wizard — clinic to payments', to: '/doctor-onboarding', icon: '✚' },
        ].map((card) => (
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

      {/* Today's upcoming */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Today's upcoming consultations</h2>
          <Link to="/doctor-dashboard" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="appt-list">
          {APPOINTMENTS.map((a) => (
            <Link
              key={a.id}
              to="/consultations"
              className="appt-row"
              style={{ padding: '10px 8px', textDecoration: 'none' }}
            >
              <div className="appt-avatar">{a.initials}</div>
              <div className="appt-info">
                <div className="appt-name">{a.name}</div>
                <div className="appt-meta">{a.complaint} · {a.type}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className="appt-time">{a.time}</span>
                <span className={`badge ${a.statusClass}`}>{a.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
