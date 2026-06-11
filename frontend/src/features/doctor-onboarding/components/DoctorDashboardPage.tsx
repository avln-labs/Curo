import { Link } from 'react-router-dom';

const TODAY = 'Monday, 9 June 2026';

const APPOINTMENTS = [
  { id: 'a1', time: '09:00 AM', name: 'Rohan Kumar',     initials: 'RK', age: 34, complaint: 'Recurring fever',       type: 'Online',    status: 'Confirmed',    statusClass: 'badge-success' },
  { id: 'a2', time: '09:30 AM', name: 'Priya Mehta',     initials: 'PM', age: 27, complaint: 'Migraine headache',     type: 'Online',    status: 'In Progress',  statusClass: 'badge-info' },
  { id: 'a3', time: '10:00 AM', name: 'Ankit Joshi',     initials: 'AJ', age: 45, complaint: 'Back pain — chronic',   type: 'In-person', status: 'Confirmed',    statusClass: 'badge-success' },
  { id: 'a4', time: '10:30 AM', name: 'Sunita Rao',      initials: 'SR', age: 52, complaint: 'Diabetes follow-up',    type: 'In-person', status: 'Payment Due',  statusClass: 'badge-warning' },
  { id: 'a5', time: '11:00 AM', name: 'Karan Desai',     initials: 'KD', age: 31, complaint: 'Digestive complaint',   type: 'Online',    status: 'Confirmed',    statusClass: 'badge-success' },
  { id: 'a6', time: '11:30 AM', name: 'Meera Pillai',    initials: 'MP', age: 39, complaint: 'Skin rash — 2 weeks',   type: 'In-person', status: 'Confirmed',    statusClass: 'badge-success' },
  { id: 'a7', time: '02:00 PM', name: 'Vijay Sharma',    initials: 'VS', age: 60, complaint: 'BP check + ECG review', type: 'In-person', status: 'Confirmed',    statusClass: 'badge-success' },
  { id: 'a8', time: '03:00 PM', name: 'Divya Nair',      initials: 'DN', age: 24, complaint: 'Throat infection',      type: 'Online',    status: 'Confirmed',    statusClass: 'badge-success' },
];

const SLOTS = [
  { time: '09:00', status: 'taken' },
  { time: '09:30', status: 'next' },
  { time: '10:00', status: 'taken' },
  { time: '10:30', status: 'taken' },
  { time: '11:00', status: 'available' },
  { time: '11:30', status: 'available' },
  { time: '12:00', status: 'available' },
  { time: '02:00', status: 'available' },
  { time: '02:30', status: 'available' },
  { time: '03:00', status: 'available' },
  { time: '03:30', status: 'available' },
];

const NEXT = APPOINTMENTS[0];

export function DoctorDashboardPage() {
  return (
    <main className="page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Good morning, Dr. Sharma 👋</h1>
        <p className="page-subtitle">{TODAY} &nbsp;·&nbsp; 8 appointments scheduled</p>
      </div>

      {/* Stats Strip */}
      <div className="stats-strip">
        <div className="stat-item">
          <div className="stat-value">8</div>
          <div className="stat-label">Appointments today</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">₹5,600</div>
          <div className="stat-label">Collected today</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">1</div>
          <div className="stat-label">Payment pending</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">3</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left: Next consult + today's list */}
        <div>
          {/* Next Consult Card */}
          <div className="next-consult-card">
            <div className="flex-between mb-2">
              <span className="badge badge-primary">▶ Up next · 09:00 AM</span>
              <span className="text-xs text-muted">Online</span>
            </div>

            <div className="next-consult-header">
              <div className="patient-avatar-lg">{NEXT.initials}</div>
              <div className="next-consult-info">
                <h3>{NEXT.name}</h3>
                <p className="text-sm text-muted">{NEXT.age} yrs · Male · Blood Group B+</p>
                <p className="text-sm" style={{ marginTop: 4 }}>
                  <strong>Complaint:</strong> {NEXT.complaint} — 3 days
                </p>
              </div>
            </div>

            <div className="ai-brief">
              <div className="ai-brief-label">AI Pre-Consult Brief</div>
              Patient has had 2 prior visits for fever episodes (Apr 2025, Nov 2024). Previously responded to Paracetamol + ORS. No known drug allergies. CBC and dengue NS1 were negative in Nov 2024. Current episode: fever 101°F since 3 days, associated mild headache.
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

          {/* Today's List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's appointments</h2>
            </div>
            <div className="appt-list">
              {APPOINTMENTS.map((a) => (
                <Link
                  key={a.id}
                  to="/consultations"
                  className="appt-row"
                  style={{ textDecoration: 'none', padding: '10px 8px' }}
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
        </div>

        {/* Right: Slot grid */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's slots</h2>
            </div>
            <div className="slot-grid">
              {SLOTS.map((s) => (
                <div key={s.time} className={`slot ${s.status}`}>
                  {s.time}
                </div>
              ))}
            </div>
            <div className="flex-gap-2 flex" style={{ marginTop: 16, flexWrap: 'wrap', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="slot next" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>•</span> Next up
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="slot taken" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>•</span> Taken
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="slot available" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>•</span> Available
              </span>
            </div>
          </div>

          {/* Booking link card */}
          <div className="card mt-3">
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
              curo.app/dr-arun-sharma
            </div>
            <button className="btn btn-secondary btn-sm">Copy link</button>
          </div>
        </div>
      </div>
    </main>
  );
}
