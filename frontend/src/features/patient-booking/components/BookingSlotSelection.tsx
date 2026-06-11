import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function save(data: Record<string, unknown>) {
  const prev = JSON.parse(localStorage.getItem('curo.booking') || '{}');
  localStorage.setItem('curo.booking', JSON.stringify({ ...prev, ...data }));
}

function BookingSteps({ current }: { current: number }) {
  const steps = ['Your Details', 'Symptoms', 'Select Slot', 'Payment'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === current;
        const isDone = n < current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: n < steps.length ? 1 : 'unset' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--surface-raised)',
                color: isDone || isActive ? 'white' : 'var(--text-tertiary)',
                border: `2px solid ${isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-strong)'}`,
              }}>
                {isDone ? '✓' : n}
              </div>
              {n <= current && (
                <span style={{ fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {label}
                </span>
              )}
            </div>
            {n < steps.length && (
              <div style={{ flex: 1, height: 1, background: isDone ? 'var(--success)' : 'var(--border)', margin: '0 10px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const AVAILABLE_DATES = [9, 10, 11, 12, 16, 17, 18, 19, 23, 24, 25, 26];

const SLOTS_BY_DATE: Record<number, { time: string; available: boolean }[]> = {
  9:  [{ time: '09:00', available: false }, { time: '09:30', available: false }, { time: '10:00', available: true }, { time: '10:30', available: true }, { time: '11:00', available: true }, { time: '11:30', available: true }],
  10: [{ time: '09:00', available: true  }, { time: '09:30', available: true  }, { time: '10:00', available: true }, { time: '10:30', available: false }, { time: '11:00', available: true }, { time: '11:30', available: true }],
  11: [{ time: '09:00', available: true  }, { time: '09:30', available: true  }, { time: '10:00', available: true }, { time: '10:30', available: true  }, { time: '11:00', available: true }, { time: '11:30', available: false }],
};

export function BookingSlotSelection() {
  const navigate = useNavigate();
  const today = new Date(2026, 5, 9); // June 9, 2026
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');

  const year = 2026;
  const month = 5; // June (0-indexed)
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const slots = selectedDate ? (SLOTS_BY_DATE[selectedDate] || SLOTS_BY_DATE[10]) : [];

  function next() {
    save({ date: `2026-06-${String(selectedDate).padStart(2,'0')}`, slot: selectedSlot });
    navigate('/booking/payment');
  }

  return (
    <div className="booking-shell">
      <div className="booking-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo">C</div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>CURO</span>
        </div>
        <span className="text-sm text-muted">Book with Dr. Arun Sharma</span>
      </div>

      <div className="booking-container">
        <BookingSteps current={3} />
        <h2 style={{ marginBottom: 4 }}>Select a date & time</h2>
        <p className="text-sm text-muted" style={{ marginBottom: 24 }}>Your slot will be held for 10 minutes during payment.</p>

        {/* Calendar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>{MONTH_NAMES[month]} {year}</span>
            <span className="text-sm text-muted">Dr. Arun Sharma</span>
          </div>

          <div className="calendar-grid">
            {DAY_NAMES.map((d) => <div key={d} className="cal-day-name">{d}</div>)}
            {calCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const isPast = day < 9;
              const isAvail = AVAILABLE_DATES.includes(day);
              const isSel = selectedDate === day;
              const isToday = day === 9;
              let cls = 'cal-day';
              if (isPast)  cls += ' disabled';
              else if (isSel) cls += ' selected';
              else if (isAvail) cls += ' available';
              else cls += ' disabled';
              if (isToday && !isSel) cls += ' today';
              return (
                <div
                  key={day}
                  className={cls}
                  onClick={() => { if (!isPast && isAvail) { setSelectedDate(day); setSelectedSlot(''); } }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="flex-gap-2 flex" style={{ marginTop: 12, fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary-muted)', border: '1px solid var(--primary)', display: 'inline-block' }} />
              Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'inline-block' }} />
              Unavailable
            </span>
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              Available times — June {selectedDate}
            </div>
            <div className="slot-grid" style={{ marginBottom: 80 }}>
              {slots.map((s) => (
                <button
                  key={s.time}
                  className={`slot ${!s.available ? 'taken' : selectedSlot === s.time ? 'selected' : 'available'}`}
                  onClick={() => s.available && setSelectedSlot(s.time)}
                  disabled={!s.available}
                >
                  {s.time}
                  {!s.available && <span style={{ marginLeft: 4, fontSize: '0.65rem' }}>Taken</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {!selectedDate && <div style={{ paddingBottom: 80 }} />}
      </div>

      <div className="sticky-cta">
        <button className="btn btn-ghost" onClick={() => navigate('/booking/symptoms')}>← Back</button>
        <button
          className="btn btn-primary btn-lg"
          style={{ flex: 1 }}
          onClick={next}
          disabled={!selectedDate || !selectedSlot}
        >
          {selectedSlot ? `Confirm ${selectedSlot} →` : 'Select a slot →'}
        </button>
      </div>
    </div>
  );
}
