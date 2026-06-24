import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api, doctorApi } from '../../../shared/api';
import { QRCodeSVG } from 'qrcode.react';

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
  date_of_birth: string | null;
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
    case 'confirmed': return 'badge-info'; // UPCOMING
    case 'in_progress': return 'badge-primary'; // LIVE
    case 'completed': return 'badge-success';
    case 'payment_pending': return 'badge-warning';
    case 'cancelled': return 'badge-error';
    default: return 'badge-neutral';
  }
}

function statusLabel(status: string) {
  if (status === 'confirmed') return 'Upcoming';
  if (status === 'in_progress') return 'Live';
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

function calculateAge(dob: string | null) {
  if (!dob) return '?';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs: 'dashboard' | 'upi'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upi'>('dashboard');
  const [appointmentsTab, setAppointmentsTab] = useState<'upcoming' | 'live' | 'completed'>('upcoming');

  // UPI Settings
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: res, error: err } = await api.get<{ success: boolean; data: DashboardData }>('/doctors/dashboard');
      if (err || !res?.success) {
        setError(err ?? 'Failed to load dashboard.');
      } else {
        setData(res.data);
      }
      
      // Load current UPI info
      const { data: profRes } = await api.get<{ success: boolean; data: any }>('/doctors/profile');
      if (profRes?.success) {
        setUpiId(profRes.data.upi_id || '');
        setUpiQrUrl(profRes.data.upi_qr_url || '');
      }
      
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveUpi = async () => {
    setSavingUpi(true);
    setUpiSuccess('');
    const { data: res, error: err } = await doctorApi.updateUpi({ upiId, upiQrUrl });
    setSavingUpi(false);
    if (res?.success) {
      setUpiSuccess('UPI Details updated successfully.');
    } else {
      setError(err || 'Failed to update UPI details.');
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const doctorName = (user as any)?.fullName || 'Doctor';

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)' }}>{error}</div>;
  if (!data) return null;

  const { date, stats = { totalAppointments: 0, confirmed: 0, completed: 0, pendingPayment: 0, collectedAmount: 0 }, appointments = [], bookingUrl = null } = data;

  const upcomingAppts = appointments.filter(a => a.status === 'confirmed');
  const liveAppts = appointments.filter(a => a.status === 'in_progress');
  const completedAppts = appointments.filter(a => a.status === 'completed');

  let activeList = upcomingAppts;
  if (appointmentsTab === 'live') activeList = liveAppts;
  if (appointmentsTab === 'completed') activeList = completedAppts;

  return (
    <main className="page" style={{ maxWidth: 1000 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{greeting}, {doctorName} 👋</h1>
          <p className="page-subtitle">
            {formatDate(date)}&nbsp;·&nbsp;
            {stats.totalAppointments === 0
              ? 'No appointments today'
              : `${stats.totalAppointments} appointment${stats.totalAppointments !== 1 ? 's' : ''} today`}
          </p>
        </div>
        
        {bookingUrl && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Public Booking Link:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)' }}>
                  {bookingUrl.replace('curo.app/', window.location.origin + '/dr/')}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(bookingUrl.replace('curo.app/', window.location.origin + '/dr/'))}>Copy</button>
              </div>
            </div>
            <div style={{ background: '#fff', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
              <QRCodeSVG value={bookingUrl.replace('curo.app/', window.location.origin + '/dr/')} size={64} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <button 
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('dashboard')}
        >
          Appointments
        </button>
        <button 
          className={`btn ${activeTab === 'upi' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setActiveTab('upi')}
        >
          UPI Settings
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="stats-strip" style={{ marginBottom: 32 }}>
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

          <div className="card">
            <div className="card-header" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button className={`btn btn-sm ${appointmentsTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAppointmentsTab('upcoming')}>
                Upcoming ({upcomingAppts.length})
              </button>
              <button className={`btn btn-sm ${appointmentsTab === 'live' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAppointmentsTab('live')}>
                Live ({liveAppts.length})
              </button>
              <button className={`btn btn-sm ${appointmentsTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAppointmentsTab('completed')}>
                Completed ({completedAppts.length})
              </button>
            </div>
            
            {activeList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No {appointmentsTab} appointments.
              </div>
            ) : (
              <div className="appt-list" style={{ padding: '0 16px 16px' }}>
                {activeList.map(a => (
                  <div key={a.id} className="appt-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div className="appt-avatar">{initials(a.patient_name)}</div>
                      <div className="appt-info">
                        <div className="appt-name" style={{ fontWeight: 600 }}>{a.patient_name} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({calculateAge(a.date_of_birth)}y, {a.gender})</span></div>
                        <div className="appt-meta" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{a.chief_complaint} · {a.consultation_type.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <span className="appt-time" style={{ fontWeight: 600 }}>{formatTime(a.slot_time)}</span>
                      <span className={`badge ${statusClass(a.status)}`}>{statusLabel(a.status)}</span>
                      {a.status !== 'completed' && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/consultations')}>Open Workspace</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'upi' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header">
            <h2 className="card-title">UPI Payment Setup</h2>
            <p className="text-muted text-sm">Patients will see these details during the booking process to make payments.</p>
          </div>
          <div style={{ padding: 24 }}>
            {upiSuccess && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: 12, borderRadius: 8, marginBottom: 16 }}>{upiSuccess}</div>}
            <div className="form-group">
              <label className="form-label">UPI ID / VPA</label>
              <input type="text" className="input" placeholder="e.g. yourname@okicici" value={upiId} onChange={e => setUpiId(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">UPI QR Code Image</label>
              <input type="file" accept="image/*" className="input" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    alert('File size must be less than 2MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setUpiQrUrl(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
              <div className="form-hint">Upload your QR code image (max 2MB). It will be saved securely.</div>
            </div>
            {upiQrUrl && (
              <div style={{ marginTop: 16, border: '1px solid var(--border)', padding: 16, borderRadius: 8, display: 'inline-block' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>QR Preview:</div>
                <img src={upiQrUrl} alt="UPI QR Preview" style={{ width: 150, height: 150, objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <button className={`btn btn-primary ${savingUpi ? 'loading' : ''}`} onClick={handleSaveUpi} disabled={savingUpi}>Save UPI Details</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
