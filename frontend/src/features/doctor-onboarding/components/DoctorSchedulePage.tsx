import { useEffect, useState } from 'react';
import { doctorApi } from '../../../shared/api';

interface ScheduleDay {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ScheduleSettings {
  buffer_minutes: number;
  max_patients_per_day: number;
  min_booking_advance_minutes: number;
  cancellation_window_hours: number;
}

interface BlockedDate {
  date: string;
  reason?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(t: string) {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  return `${h % 12 === 0 ? 12 : h % 12}:${mStr} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newBlockDate, setNewBlockDate] = useState('');
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await doctorApi.getSchedule();
      if (err || !data?.success) {
        setError(err || 'Failed to load schedule.');
        setLoading(false);
        return;
      }
      const d = data.data as Record<string, any>;
      setSchedule((d.schedule as ScheduleDay[]) || []);
      setSettings(d.settings as ScheduleSettings);
      setBlockedDates((d.blockedDates as BlockedDate[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleBlockDate() {
    if (!newBlockDate) return;
    setBlocking(true);
    await doctorApi.blockDates({ dates: [newBlockDate] });
    setBlockedDates((prev) => [...prev, { date: newBlockDate }]);
    setNewBlockDate('');
    setBlocking(false);
  }

  async function handleUnblock(date: string) {
    await doctorApi.unblockDates({ dates: [date] });
    setBlockedDates((prev) => prev.filter((d) => d.date !== date));
  }

  if (loading) {
    return (
      <main className="page">
        <div className="page-header"><h1 className="page-title">Schedule</h1></div>
        <div className="card" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Loading schedule…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="page-header"><h1 className="page-title">Schedule</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--error)', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </main>
    );
  }

  const activeDays = schedule.filter((d) => d.is_active).sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <main className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Schedule</h1>
            <p className="page-subtitle">Your weekly recurring availability</p>
          </div>
          <a href="/doctor-onboarding" className="btn btn-secondary btn-sm">Edit Schedule</a>
        </div>
      </div>

      {activeDays.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <p className="text-muted">No schedule set up yet.</p>
          <a href="/doctor-onboarding" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>Set Up Schedule →</a>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'flex-start' }}>
          {/* Weekly schedule */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Weekly availability</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activeDays.map((row) => (
                <div
                  key={row.day_of_week}
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <div className="flex-between">
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{DAY_NAMES[row.day_of_week]}</span>
                    <span className="badge badge-success">Active</span>
                  </div>
                  <div className="text-sm text-muted">
                    {formatTime(row.start_time)} — {formatTime(row.end_time)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div>
            {settings && (
              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 16 }}>Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Buffer between slots', value: `${settings.buffer_minutes} min` },
                    { label: 'Max patients / day', value: String(settings.max_patients_per_day) },
                    { label: 'Min advance booking', value: `${settings.min_booking_advance_minutes} min` },
                    { label: 'Cancellation window', value: `${settings.cancellation_window_hours} hr before slot` },
                  ].map((item) => (
                    <div key={item.label} className="flex-between" style={{ fontSize: '0.875rem' }}>
                      <span className="text-muted">{item.label}</span>
                      <span style={{ fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card mt-3">
              <h2 className="card-title" style={{ marginBottom: 16 }}>Blocked dates</h2>
              {blockedDates.length === 0 ? (
                <p className="text-sm text-muted">No blocked dates.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {blockedDates.map((bd) => (
                    <div key={bd.date} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      <div>
                        <span className="mono">{bd.date}</span>
                        {bd.reason && <span className="text-xs text-muted" style={{ marginLeft: 8 }}>{bd.reason}</span>}
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => handleUnblock(bd.date)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  className="input"
                  type="date"
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleBlockDate}
                  disabled={!newBlockDate || blocking}
                >
                  {blocking ? '…' : '+ Block'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
