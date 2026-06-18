import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../shared/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalAppointments: number;
  confirmed: number;
  completed: number;
  pendingPayment: number;
  collectedAmount: number;
}

interface Appointment {
  id: string;
  slot_time: string;
  status: string;
  chief_complaint: string;
  patient_name: string;
  age: number | null;
  gender: string | null;
  consultation_type: string;
  fee: string;
}

interface DashboardData {
  date: string;
  stats: DashboardStats;
  appointments: Appointment[];
  nextAppointment: Appointment | null;
  bookingUrl: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusClass(status: string) {
  switch (status) {
    case 'confirmed': return 'badge-success';
    case 'in_progress': return 'badge-info';
    case 'completed': return 'badge-success';
    case 'payment_pending': return 'badge-warning';
    case 'cancelled': return 'badge-error';
    default: return 'badge-neutral';
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTime(t: string) {
  // t is HH:MM:SS from PostgreSQL TIME column
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: res, error: err } = await api.get<{ success: boolean } & DashboardData>('/doctors/dashboard');
      if (err || !res?.success) {
        setError(err ?? 'Failed to load dashboard.');
      } else {
        setData(res);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const doctorName = (user as any)?.fullName || 'Doctor';

  if (loading) {
    return (
      <main className="page">
        <div className="page-header">
          <h1 className="page-title">{greeting}, {doctorName} 👋</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-item" style={{ flex: 1, background: 'var(--surface-raised)', borderRadius: 'var(--radius)', height: 72, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div className="card" style={{ height: 240, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: 'var(--error)', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  if (!data) return null;

const {
  date,
  stats = {
    totalAppointments: 0,
    confirmed: 0,
    completed: 0,
    pendingPayment: 0,
    collectedAmount: 0,
  },
  appointments = [],
  nextAppointment = null,
  bookingUrl = null,
} = data;
  return (
    <main className="page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{greeting}, {doctorName} 👋</h1>
        <p className="page-subtitle">
          {formatDate(date)}&nbsp;·&nbsp;
          {stats.totalAppointments === 0
            ? 'No appointments today'
            : `${stats.totalAppointments} appointment${stats.totalAppointments !== 1 ? 's' : ''} scheduled`}
        </p>
      </div>

      {/* Stats Strip */}
      <div className="stats-strip">
        <div className="stat-item">
          <div className="stat-value">{stats.totalAppointments}</div>
          <div className="stat-label">Appointments today</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">₹{stats.collectedAmount.toLocaleString('en-IN')}</div>
          <div className="stat-label">Collected today</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.pendingPayment}</div>
          <div className="stat-label">Payment pending</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left: Next consult + today's list */}
        <div>
          {/* Next Consult Card */}
          {nextAppointment ? (
            <div className="next-consult-card">
              <div className="flex-between mb-2">
                <span className="badge badge-primary">▶ Up next · {formatTime(nextAppointment.slot_time)}</span>
                <span className="text-xs text-muted">{nextAppointment.consultation_type.replace(/_/g, ' ')}</span>
              </div>

              <div className="next-consult-header">
                <div className="patient-avatar-lg">{initials(nextAppointment.patient_name)}</div>
                <div className="next-consult-info">
                  <h3>{nextAppointment.patient_name}</h3>
                  <p className="text-sm text-muted">
                    {nextAppointment.age ? `${nextAppointment.age} yrs` : ''}
                    {nextAppointment.gender ? ` · ${nextAppointment.gender}` : ''}
                  </p>
                  <p className="text-sm" style={{ marginTop: 4 }}>
                    <strong>Complaint:</strong> {nextAppointment.chief_complaint}
                  </p>
                </div>
              </div>

              <div className="flex-gap-2 flex">
                <Link to="/consultations" className="btn btn-primary">
                  Start Consultation
                </Link>
                <Link to="/consultations" className="btn btn-secondary">
                  View Full Notes
                </Link>
              </div>
            </div>
          ) : (
            <div className="next-consult-card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No upcoming appointments for today.
              </p>
              {bookingUrl && (
                <p className="text-xs text-muted" style={{ marginTop: 8 }}>
                  Share your booking link to get appointments!
                </p>
              )}
            </div>
          )}

          {/* Today's List */}
          {appointments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Today's appointments</h2>
              </div>
              <div className="appt-list">
                {appointments.map((a) => (
                  <Link
                    key={a.id}
                    to="/consultations"
                    className="appt-row"
                    style={{ textDecoration: 'none', padding: '10px 8px' }}
                  >
                    <div className="appt-avatar">{initials(a.patient_name)}</div>
                    <div className="appt-info">
                      <div className="appt-name">{a.patient_name}</div>
                      <div className="appt-meta">{a.chief_complaint} · {a.consultation_type.replace(/_/g, ' ')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className="appt-time">{formatTime(a.slot_time)}</span>
                      <span className={`badge ${statusClass(a.status)}`}>{statusLabel(a.status)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
              <p className="text-muted text-sm">No appointments today. Your schedule is clear!</p>
              <Link to="/doctor-onboarding" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
                Complete Onboarding →
              </Link>
            </div>
          )}
        </div>

        {/* Right: Booking link */}
        <div>
          {bookingUrl && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Your booking link</h2>
              </div>
              <div
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8125rem',
                  color: 'var(--primary)',
                  wordBreak: 'break-all',
                  marginBottom: 12,
                }}
              >
                {bookingUrl}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigator.clipboard.writeText(`https://${bookingUrl}`).catch(() => { })}
              >
                Copy link
              </button>

              {/* Onboarding reminder if profile incomplete */}
              {(user as any)?.needsOnboarding && (
                <div className="notice notice-info" style={{ marginTop: 16 }}>
                  <strong>Complete your setup</strong> — Finish the onboarding wizard to activate your booking link.
                  <Link to="/doctor-onboarding" className="btn btn-primary btn-sm" style={{ marginTop: 8, display: 'block' }}>
                    Go to Setup →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
