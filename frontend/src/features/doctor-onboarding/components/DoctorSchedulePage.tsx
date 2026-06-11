const SCHEDULE = [
  { day: 'Monday',    slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'], break: '12:00–13:00' },
  { day: 'Tuesday',   slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'], break: '12:00–13:00' },
  { day: 'Wednesday', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'], break: '12:00–13:00' },
  { day: 'Thursday',  slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'], break: '12:00–14:00' },
  { day: 'Friday',    slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'], break: '12:00–14:00' },
  { day: 'Saturday',  slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'], break: 'None' },
];

const BLOCKED = ['2026-06-15', '2026-06-16', '2026-06-22'];

export function DoctorSchedulePage() {
  return (
    <main className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Schedule</h1>
            <p className="page-subtitle">Dr. Arun Sharma · Weekly recurring schedule · 15-min slots · 5-min buffer</p>
          </div>
          <button className="btn btn-primary">Edit Schedule</button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Weekly schedule */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>Weekly availability</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SCHEDULE.map((row) => (
              <div
                key={row.day}
                style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div className="flex-between">
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.day}</span>
                  <span className="badge badge-success">{row.slots.length} slots</span>
                </div>
                <div className="slot-grid">
                  {row.slots.map((s) => (
                    <div key={s} className="slot available" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>{s}</div>
                  ))}
                </div>
                <div className="text-xs text-muted">Break: {row.break}</div>
              </div>
            ))}
            <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Sunday</span>
              <span className="badge badge-neutral">Closed</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Slot duration', value: '15 minutes' },
                { label: 'Buffer between slots', value: '5 minutes' },
                { label: 'Max patients / day', value: '25' },
                { label: 'Min advance booking', value: '30 minutes' },
                { label: 'Cancellation window', value: '2 hours before slot' },
              ].map((item) => (
                <div key={item.label} className="flex-between" style={{ fontSize: '0.875rem' }}>
                  <span className="text-muted">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-3">
            <h2 className="card-title" style={{ marginBottom: 16 }}>Blocked dates</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BLOCKED.map((date) => (
                <div key={date} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span className="mono">{date}</span>
                  <button className="btn btn-danger btn-sm">Remove</button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>+ Block a date</button>
          </div>
        </div>
      </div>
    </main>
  );
}
