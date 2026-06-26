import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, bookingsApi } from '../../shared/api';
import { useAuth } from '../auth/AuthContext';

interface BookingWizardProps {
  doctor: {
    id: string;
    slug: string;
    full_name: string;
    upi_id?: string;
    upi_qr_url?: string;
  };
}

type Step = 'SLOT' | 'AUTH' | 'PATIENT' | 'SYMPTOMS' | 'PAYMENT' | 'SUCCESS';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatTime12H(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.slice(0, 2)} ${suffix}`;
}

export function BookingWizard({ doctor }: BookingWizardProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('SLOT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Slot
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotDuration, setSlotDuration] = useState(15);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const getCalendarCells = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      const now = new Date();
      const minDate = new Date(now.getFullYear(), now.getMonth(), 1);
      if (d < minDate) return prev;
      return d;
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${dayStr}`);
    setSelectedTime('');
  };

  const isDateInPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateToCheck < today;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split('-').map(Number);
    return (
      day === d &&
      currentMonth.getMonth() === (m - 1) &&
      currentMonth.getFullYear() === y
    );
  };

  const getSlotGroups = () => {
    const morning: typeof slots = [];
    const afternoon: typeof slots = [];
    const evening: typeof slots = [];

    slots.forEach(s => {
      const h = parseInt(s.time.split(':')[0], 10);
      if (h < 12) morning.push(s);
      else if (h < 17) afternoon.push(s);
      else evening.push(s);
    });

    return { morning, afternoon, evening };
  };

  // Step 2a: Auth
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Step 2b: Patient
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  // Step 3: Symptoms
  const [consultationType, setConsultationType] = useState<'online' | 'in_person'>('online');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [description, setDescription] = useState('');

  // Step 4: Payment
  const [appointment, setAppointment] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');

  // --- Load Slots ---
  useEffect(() => {
    async function loadSlots() {
      try {
        const res = await api.get<{ success: boolean; data: any }>(`/doctors/${doctor.slug}/slots?date=${selectedDate}`);
        if (res.data?.success) {
          setSlots(res.data.data.slots);
          setSlotDuration(res.data.data.slotDuration);
        }
      } catch (err) {
        console.error('Failed to load slots', err);
        setSlots([]);
      }
    }
    loadSlots();
  }, [doctor.slug, selectedDate]);

  // --- Pre-fill patient details if authenticated ---
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'PATIENT') {
      const stored = localStorage.getItem('curo.user');
      if (stored) {
        try {
          const p = JSON.parse(stored);
          setFullName(p.name || '');
          setDateOfBirth(p.dateOfBirth || '');
          setGender(p.gender || '');
        } catch {}
      }
    }
  }, [isAuthenticated, user]);

  // --- Handlers ---
  const handleSlotNext = () => {
    if (!selectedTime) return setError('Please select a time slot.');
    setError('');
    if (isAuthenticated && user?.role === 'PATIENT') {
      // Check if user has completed onboarding
      const stored = localStorage.getItem('curo.user');
      let onboardingComplete = false;
      if (stored) {
        try { onboardingComplete = JSON.parse(stored).onboardingComplete; } catch {}
      }
      setStep(onboardingComplete ? 'SYMPTOMS' : 'PATIENT');
    } else {
      setStep('AUTH');
    }
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) return setError('Enter a valid 10-digit mobile number.');
    setError('');
    setLoading(true);
    const { success, message } = await sendOtp(mobile, 'PATIENT');
    setLoading(false);
    if (success) {
      setOtpSent(true);
    } else {
      setError(message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP.');
    setError('');
    setLoading(true);
    const { success, message, isNewUser } = await verifyOtp(mobile, otp, 'PATIENT');
    setLoading(false);
    if (success) {
      setStep(isNewUser ? 'PATIENT' : 'SYMPTOMS');
    } else {
      setError(message || 'Invalid OTP.');
    }
  };

  const handlePatientNext = async () => {
    if (!fullName || !dateOfBirth || !gender) return setError('Please fill all required fields.');
    setError('');
    setLoading(true);
    // Submit patient onboarding inline
    const res = await api.post('/patients/me/onboarding', { fullName, dateOfBirth, gender });
    setLoading(false);
    if ((res.data as any)?.success) {
      // Update local storage
      const stored = localStorage.getItem('curo.user');
      if (stored) {
        try {
          const p = JSON.parse(stored);
          p.name = fullName;
          p.onboardingComplete = true;
          localStorage.setItem('curo.user', JSON.stringify(p));
        } catch {}
      }
      setStep('SYMPTOMS');
    } else {
      setError((res.data as any)?.error?.message || 'Failed to save patient details.');
    }
  };

  const handleSymptomsNext = async () => {
    if (!chiefComplaint) return setError('Please enter your chief complaint.');
    setError('');
    setLoading(true);
    const { data, error: err } = await bookingsApi.create({
      doctorSlug: doctor.slug,
      slotDate: selectedDate,
      slotTime: selectedTime,
      consultationType,
      chiefComplaint,
      description
    });
    setLoading(false);
    
    if (err || !data?.success) {
      return setError(err || data?.message || 'Failed to create appointment.');
    }

    setAppointment(data.appointment);
    setStep('PAYMENT');
  };

  const handlePaymentConfirm = async () => {
    if (!utrNumber) return setError('Please enter the UTR/Reference number.');
    setError('');
    setLoading(true);
    const { data, error: err } = await bookingsApi.confirmPayment(appointment.id, { utrNumber });
    setLoading(false);

    if (err || !data?.success) {
      return setError(err || data?.message || 'Failed to confirm payment.');
    }

    setStep('SUCCESS');
  };

  // --- Renderers ---

  if (step === 'SUCCESS') {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', borderRadius: '12px', border: '1px solid #e6dfd8', background: '#faf9f5' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>✓</div>
        <h2 style={{ marginBottom: 16 }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your appointment with Dr. {doctor.full_name} is confirmed for {new Date(selectedDate).toLocaleDateString()} at {formatTime12H(selectedTime)}.</p>
        <button className="btn btn-primary" onClick={() => navigate('/records')} style={{ background: '#cc785c', borderColor: '#cc785c', color: '#ffffff' }}>Go to My Records</button>
      </div>
    );
  }

  return (
    <div className="card" style={{
      '--primary': '#cc785c',
      '--primary-hover': '#a9583e',
      '--primary-muted': '#faf0e8',
      borderRadius: '12px',
      border: '1px solid #e6dfd8',
      background: '#faf9f5',
    } as React.CSSProperties}>
      <div className="card-header" style={{ paddingBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Book Appointment</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['SLOT', 'AUTH', 'PATIENT', 'SYMPTOMS', 'PAYMENT'] as Step[]).map((s, i) => {
              // Hide AUTH/PATIENT dots if not needed
              if ((s === 'AUTH' || s === 'PATIENT') && isAuthenticated && user?.role === 'PATIENT') {
                 // Check if onboarding is complete (rough check)
                 if (fullName) return null; 
              }
              const isActive = step === s;
              const isPast = ['SLOT', 'AUTH', 'PATIENT', 'SYMPTOMS', 'PAYMENT'].indexOf(s) < ['SLOT', 'AUTH', 'PATIENT', 'SYMPTOMS', 'PAYMENT'].indexOf(step);
              return (
                <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? 'var(--primary)' : isPast ? 'var(--primary-muted)' : 'var(--border)' }} />
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: '0.875rem' }}>{error}</div>}

        {step === 'SLOT' && (
          <div>
            <div className="form-group">
              <label className="form-label" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', letterSpacing: '-0.2px', marginBottom: 12 }}>Select Date</label>
              
              <div style={{ background: '#faf9f5', border: '1px solid #e6dfd8', borderRadius: '12px', padding: '16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#141413' }}>
                    {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm" 
                      onClick={prevMonth}
                      style={{ padding: '4px 8px', minWidth: 'unset', color: '#6c6a64', cursor: 'pointer' }}
                    >
                      ←
                    </button>
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm" 
                      onClick={nextMonth}
                      style={{ padding: '4px 8px', minWidth: 'unset', color: '#6c6a64', cursor: 'pointer' }}
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="calendar-grid">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="cal-day-name" style={{ color: '#8e8b82', fontWeight: 500 }}>{d}</div>
                  ))}
                  {getCalendarCells().map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} />;
                    }
                    const isPast = isDateInPast(day);
                    const isSel = isSelected(day);
                    const isTday = isToday(day);

                    let style: React.CSSProperties = {
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      cursor: isPast ? 'default' : 'pointer',
                      color: isPast ? '#8e8b82' : isSel ? '#ffffff' : '#141413',
                      background: isSel ? '#cc785c' : isTday ? '#efe9de' : 'transparent',
                      fontWeight: isSel || isTday ? 600 : 400,
                      border: isTday && !isSel ? '1px solid #cc785c' : 'none',
                    };

                    return (
                      <div
                        key={`day-${day}`}
                        style={style}
                        onClick={() => {
                          if (!isPast) {
                            handleDateSelect(day);
                          }
                        }}
                        className={`cal-day ${isPast ? 'disabled' : ''} ${isSel ? 'selected' : ''}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label className="form-label" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', letterSpacing: '-0.2px', marginBottom: 12 }}>Available Slots</label>
              
              {slots.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#8e8b82', background: '#faf9f5', border: '1px dashed #e6dfd8', borderRadius: '12px' }}>
                  No slots available for this date.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Morning Slots */}
                  {getSlotGroups().morning.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6c6a64', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Morning</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                        {getSlotGroups().morning.map(s => (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedTime(s.time)}
                            style={{
                              padding: '10px 0',
                              borderRadius: '8px',
                              border: selectedTime === s.time ? '1px solid #cc785c' : '1px solid #e6dfd8',
                              background: selectedTime === s.time ? '#faf0e8' : s.available ? '#ffffff' : '#f5f0e8',
                              color: selectedTime === s.time ? '#cc785c' : s.available ? '#141413' : '#8e8b82',
                              cursor: s.available ? 'pointer' : 'not-allowed',
                              fontWeight: selectedTime === s.time ? 600 : 400,
                              fontSize: '0.85rem',
                              textDecoration: s.available ? 'none' : 'line-through',
                            }}
                          >
                            {formatTime12H(s.time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Slots */}
                  {getSlotGroups().afternoon.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6c6a64', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Afternoon</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                        {getSlotGroups().afternoon.map(s => (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedTime(s.time)}
                            style={{
                              padding: '10px 0',
                              borderRadius: '8px',
                              border: selectedTime === s.time ? '1px solid #cc785c' : '1px solid #e6dfd8',
                              background: selectedTime === s.time ? '#faf0e8' : s.available ? '#ffffff' : '#f5f0e8',
                              color: selectedTime === s.time ? '#cc785c' : s.available ? '#141413' : '#8e8b82',
                              cursor: s.available ? 'pointer' : 'not-allowed',
                              fontWeight: selectedTime === s.time ? 600 : 400,
                              fontSize: '0.85rem',
                              textDecoration: s.available ? 'none' : 'line-through',
                            }}
                          >
                            {formatTime12H(s.time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evening Slots */}
                  {getSlotGroups().evening.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6c6a64', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evening</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                        {getSlotGroups().evening.map(s => (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedTime(s.time)}
                            style={{
                              padding: '10px 0',
                              borderRadius: '8px',
                              border: selectedTime === s.time ? '1px solid #cc785c' : '1px solid #e6dfd8',
                              background: selectedTime === s.time ? '#faf0e8' : s.available ? '#ffffff' : '#f5f0e8',
                              color: selectedTime === s.time ? '#cc785c' : s.available ? '#141413' : '#8e8b82',
                              cursor: s.available ? 'pointer' : 'not-allowed',
                              fontWeight: selectedTime === s.time ? 600 : 400,
                              fontSize: '0.85rem',
                              textDecoration: s.available ? 'none' : 'line-through',
                            }}
                          >
                            {formatTime12H(s.time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSlotNext} 
                disabled={!selectedTime}
                style={{ background: '#cc785c', borderColor: '#cc785c', color: '#ffffff' }}
              >
                {selectedTime ? `Confirm ${formatTime12H(selectedTime)} →` : 'Select a slot →'}
              </button>
            </div>
          </div>
        )}

        {step === 'AUTH' && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Your Details</h3>
            {!otpSent ? (
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRight: 'none', borderTopLeftRadius: 'var(--radius)', borderBottomLeftRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>+91</span>
                  <input type="tel" className="input" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0,10))} placeholder="10-digit mobile number" />
                </div>
                <button className={`btn btn-primary ${loading ? 'loading' : ''}`} style={{ marginTop: 16, width: '100%' }} onClick={handleSendOtp} disabled={mobile.length !== 10 || loading}>Send OTP</button>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Enter OTP sent to +91 {mobile}</label>
                <input type="text" className="input" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} placeholder="6-digit OTP" />
                <button className={`btn btn-primary ${loading ? 'loading' : ''}`} style={{ marginTop: 16, width: '100%' }} onClick={handleVerifyOtp} disabled={otp.length !== 6 || loading}>Verify & Continue</button>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => setOtpSent(false)} disabled={loading}>Change Mobile Number</button>
              </div>
            )}
          </div>
        )}

        {step === 'PATIENT' && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Patient Details</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="input" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="select input" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handlePatientNext} disabled={!fullName || !dateOfBirth || !gender || loading}>Continue</button>
            </div>
          </div>
        )}

        {step === 'SYMPTOMS' && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Consultation Details</h3>
            
            <div className="form-group">
              <label className="form-label">Consultation Type</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', background: consultationType === 'online' ? 'var(--primary-muted)' : 'transparent', borderColor: consultationType === 'online' ? 'var(--primary)' : 'var(--border)' }}>
                  <input type="radio" name="ctype" value="online" checked={consultationType === 'online'} onChange={() => setConsultationType('online')} style={{ accentColor: 'var(--primary)' }} />
                  Online
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', background: consultationType === 'in_person' ? 'var(--primary-muted)' : 'transparent', borderColor: consultationType === 'in_person' ? 'var(--primary)' : 'var(--border)' }}>
                  <input type="radio" name="ctype" value="in_person" checked={consultationType === 'in_person'} onChange={() => setConsultationType('in_person')} style={{ accentColor: 'var(--primary)' }} />
                  In Clinic
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label className="form-label">Chief Complaint <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="text" className="input" value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} placeholder="e.g. Fever and headache for 3 days" />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Details (Optional)</label>
              <textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Any other symptoms or medical history..." />
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handleSymptomsNext} disabled={!chiefComplaint || loading}>Continue to Payment</button>
            </div>
          </div>
        )}

        {step === 'PAYMENT' && appointment && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Payment</h3>
            
            <div style={{ padding: 16, background: 'var(--surface-raised)', borderRadius: 'var(--radius)', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Consultation Fee</span>
                <span style={{ fontWeight: 600 }}>₹{appointment.fee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{appointment.fee}</span>
              </div>
            </div>

            {appointment.upiQrUrl || appointment.upiId ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center' }}>
                <h4 style={{ marginBottom: 16 }}>Scan to Pay</h4>
                {appointment.upiQrUrl && (
                  <img src={appointment.upiQrUrl} alt="UPI QR" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
                )}
                {appointment.upiId && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: 24 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>UPI ID:</span>
                    <span style={{ fontWeight: 600 }}>{appointment.upiId}</span>
                  </div>
                )}
                
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label">Enter UTR / Reference Number <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="text" className="input" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="e.g. 301234567890" />
                  <div className="form-hint">Enter the 12-digit transaction reference number after making the payment.</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)' }}>
                Doctor has not set up UPI payments yet.
                <br/>
                Please pay at the clinic.
                <div className="form-group" style={{ marginTop: 24, textAlign: 'left' }}>
                  <label className="form-label">Type "PAY_AT_CLINIC" to confirm</label>
                  <input type="text" className="input" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="PAY_AT_CLINIC" />
                </div>
              </div>
            )}

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handlePaymentConfirm} disabled={!utrNumber || loading}>Confirm Payment</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
