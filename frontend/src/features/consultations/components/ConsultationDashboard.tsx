import { useState, useEffect } from 'react';
import { consultationsApi, prescriptionsApi, API_BASE, type MedicineSuggestion } from '../../../shared/api';
import { PreConsultSummary } from './PreConsultSummary';
import { PatientDocuments } from './PatientDocuments';
import { MedicineAutocomplete } from './MedicineAutocomplete';

interface PatientAppt {
  id: string;
  appointment_code: string;
  status: string;
  slot_time: string;
  chief_complaint: string;
  patient_id?: string;
  patient_name: string;
  date_of_birth: string;
  gender: string;
  allergies?: string[];
  consultation_type: string;
  meet_link?: string;
  prescription_id?: string;
}

function formatTime12H(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.slice(0, 2)} ${suffix}`;
}

function canJoinConsultation(slotTime: string) {
  if (!slotTime) return false;
  const datePart = new Date().toISOString().split('T')[0];
  const startTimeStr = `${datePart}T${slotTime.slice(0,5)}:00`;
  const startTime = new Date(startTimeStr).getTime();
  const now = Date.now();
  return now >= (startTime - 10 * 60 * 1000);
}

export function ConsultationDashboard() {
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<PatientAppt[]>([]);
  const [live, setLive] = useState<PatientAppt[]>([]);
  const [completed, setCompleted] = useState<PatientAppt[]>([]);
  const [error, setError] = useState('');

  // Active consultation state
  const [activeAppt, setActiveAppt] = useState<PatientAppt | null>(null);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prescription builder state
  const [medications, setMedications] = useState([{ drugName: '', dose: '', frequency: '', duration: '', instructions: '' }]);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [savingRx, setSavingRx] = useState(false);
  const [rxSaved, setRxSaved] = useState(false);

  const loadData = async () => {
    try {
      const res = await consultationsApi.getToday();
      if (res.data?.success) {
        setUpcoming(res.data.data.upcoming || []);
        setLive(res.data.data.live || []);
        setCompleted(res.data.data.completed || []);
      }
    } catch (err: any) {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectPatient = (appt: PatientAppt) => {
    setActiveAppt(appt);
    if (isMobile) setSidebarOpen(false);
  };

  const handleStart = async (appt: PatientAppt, autoJoin: boolean = false) => {
    setStarting(true);
    const res = await consultationsApi.start(appt.id, {});
    setStarting(false);
    if (res.data?.success) {
      setActiveAppt({ ...appt, status: 'in_progress' });
      loadData();
      if (autoJoin && appt.meet_link) {
        window.open(appt.meet_link, '_blank', 'noopener,noreferrer');
      }
    } else {
      setError((res.data as any)?.error?.message || res.data?.message || 'Failed to start consultation.');
    }
  };

  const handleSaveRx = async () => {
    if (!activeAppt) return;
    const validMeds = medications.filter(m => m.drugName.trim() !== '');
    if (validMeds.length === 0) return setError('Add at least one medication.');
    
    setSavingRx(true);
    const res = await prescriptionsApi.create({
      appointmentId: activeAppt.id,
      diagnosis,
      advice,
      medications: validMeds
    });
    setSavingRx(false);
    
    if (res.data?.success) {
      setRxSaved(true);
      setActiveAppt({ ...activeAppt, prescription_id: res.data.prescriptionId });
      loadData();
    } else {
      setError((res.data as any)?.error?.message || res.data?.message || 'Failed to save prescription.');
    }
  };

  const handleComplete = async () => {
    if (!activeAppt) return;
    if (!rxSaved && !activeAppt.prescription_id) {
      const confirm = window.confirm('Are you sure you want to end this consultation without saving a prescription?');
      if (!confirm) return;
    }
    
    setCompleting(true);
    const res = await consultationsApi.complete(activeAppt.id);
    setCompleting(false);
    
    if (res.data?.success) {
      setActiveAppt(null);
      setRxSaved(false);
      setMedications([{ drugName: '', dose: '', frequency: '', duration: '', instructions: '' }]);
      setDiagnosis('');
      setAdvice('');
      setSidebarOpen(true);
      loadData();
    } else {
      setError((res.data as any)?.error?.message || res.data?.message || 'Failed to complete consultation.');
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '?';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;

  const startingSoonAppts = upcoming.filter(a => canJoinConsultation(a.slot_time));

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
      
      {/* LEFT SIDEBAR - DARK THEME NAV */}
      <div style={{ 
        width: sidebarOpen ? (isMobile ? '100%' : '320px') : '0px', 
        minWidth: sidebarOpen ? (isMobile ? '100%' : '320px') : '0px',
        opacity: sidebarOpen ? 1 : 0,
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        color: 'var(--text-primary)', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: sidebarOpen ? '1px solid rgba(255, 255, 255, 0.6)' : 'none', 
        boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.02)' : 'none',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'opacity 0.3s ease',
        zIndex: 10
      }}>
        <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.4)', minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>CURO</h1>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>Consultation Workspace</div>
        </div>

        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 320 }}>
          {live.length > 0 && !activeAppt && (
            <div>
              <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', marginBottom: 12 }}>Live Session</h3>
              <div style={{ background: 'var(--surface-dark-elevated)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontWeight: 600 }}>{live[0].patient_name}</div>
                <div style={{ fontSize: '0.85rem', color: '#a09d96', marginBottom: 12 }}>{calculateAge(live[0].date_of_birth)}y, {live[0].gender}</div>
                <button className="btn" style={{ background: 'var(--primary)', color: 'white', width: '100%' }} onClick={() => selectPatient(live[0])}>Resume Consult</button>
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#a09d96', marginBottom: 12 }}>Upcoming Today</h3>
            {upcoming.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No more appointments today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(a => (
                  <div key={a.id} 
                       onClick={() => selectPatient(a)}
                       style={{ 
                         padding: 16, 
                         borderRadius: 'var(--radius)', 
                         background: activeAppt?.id === a.id ? 'rgba(255,255,255,0.7)' : 'transparent',
                         border: '1px solid',
                         borderColor: activeAppt?.id === a.id ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                         cursor: 'pointer',
                         transition: 'var(--transition)',
                         boxShadow: activeAppt?.id === a.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                       }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: activeAppt?.id === a.id ? 'var(--text-primary)' : 'var(--text-primary)' }}>{a.patient_name}</span>
                      <span style={{ color: activeAppt?.id === a.id ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatTime12H(a.slot_time)}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{calculateAge(a.date_of_birth)}y, {a.gender}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CANVAS - EDITORIAL CREAM */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 16px 64px' : '0 5% 64px', display: (isMobile && sidebarOpen) ? 'none' : 'block' }}>
        
        {/* Toggle Sidebar Button for Canvas */}
        <div style={{ paddingTop: 24, display: 'flex', alignItems: 'center' }}>
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'var(--transition)' }}
            >
              <span style={{ fontSize: '1.2rem' }}>☰</span> Patients
            </button>
          )}
        </div>

        {error && (
          <div style={{ maxWidth: 800, margin: '24px auto 0', background: 'var(--error-bg)', color: 'var(--error)', padding: '12px 16px', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {startingSoonAppts.length > 0 && !activeAppt && (
          <div style={{ maxWidth: 800, margin: '48px auto 0', background: 'var(--primary)', color: 'white', padding: '16px 24px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxSizing: 'border-box' }}>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>Patient waiting!</strong>
              <div style={{ opacity: 0.9, marginTop: 4 }}>Consultation with {startingSoonAppts[0].patient_name} is starting.</div>
            </div>
            <button className="btn" style={{ background: 'white', color: 'var(--primary)' }} onClick={() => handleStart(startingSoonAppts[0], true)}>
              Start & Join Meet
            </button>
          </div>
        )}

        {activeAppt ? (
          <div style={{ maxWidth: 800, margin: '24px auto', boxSizing: 'border-box' }}>
            
            {/* EDITORIAL HEADER */}
            <header style={{ marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)', fontWeight: 600, marginBottom: 12 }}>
                    {activeAppt.consultation_type === 'in_person' ? 'In-Person Consultation' : 'Online Consultation'}
                  </div>
                  <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? '2.2rem' : '3rem', margin: '0 0 12px 0', color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-1px' }}>
                    {activeAppt.patient_name}
                  </h1>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {calculateAge(activeAppt.date_of_birth)} years old • {activeAppt.gender}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
                  {activeAppt.status === 'in_progress' && activeAppt.consultation_type === 'online' && activeAppt.meet_link && (
                    <a href={activeAppt.meet_link} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--primary)', color: 'white', flex: isMobile ? 1 : 'none', textAlign: 'center' }}>Join Video Call</a>
                  )}
                  <button className="btn" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', flex: isMobile ? 1 : 'none' }} onClick={() => setActiveAppt(null)}>
                    Close Workspace
                  </button>
                </div>
              </div>
            </header>

            {/* AI BRIEFING & RECORDS */}
            <section style={{ marginBottom: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0, color: 'var(--text-primary)' }}>Briefing</h2>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
              </div>

              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Chief Complaint:</strong> {activeAppt.chief_complaint}
              </div>

              {(activeAppt.allergies?.length ?? 0) > 0 && (
                <div style={{ marginBottom: 32, padding: '16px 20px', background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)' }}>
                  <strong style={{ color: 'var(--warning)' }}>⚠ Known Allergies:</strong> <span style={{ color: 'var(--text-primary)' }}>{activeAppt.allergies!.join(', ')}</span>
                </div>
              )}

              <PreConsultSummary appointmentId={activeAppt.id} />

              {activeAppt.patient_id && (
                <div style={{ marginTop: 40 }}>
                  <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 16 }}>Uploaded Records</h3>
                  <PatientDocuments patientId={activeAppt.patient_id} />
                </div>
              )}
            </section>

            {/* CONSULTATION CONTROLS (Only if not started) */}
            {activeAppt.status === 'confirmed' && (
              <section style={{ marginBottom: 64, padding: isMobile ? 24 : 32, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 12 }}>Ready to begin?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  {activeAppt.consultation_type === 'online' ? 'A Google Meet link is automatically generated and securely shared with the patient.' : 'This is an in-person consultation.'}
                </p>
                <button className={`btn ${starting ? 'loading' : ''}`} style={{ background: 'var(--primary)', color: 'white', padding: '12px 32px', fontSize: '1.1rem', width: isMobile ? '100%' : 'auto' }} onClick={() => handleStart(activeAppt)} disabled={starting}>
                  Start Consultation
                </button>
              </section>
            )}

            {/* PRESCRIPTION PAD */}
            {activeAppt.status === 'in_progress' && (
              <section style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: isMobile ? 24 : 40, boxShadow: 'var(--shadow)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: isMobile ? '1.5rem' : '2rem', margin: 0, color: 'var(--text-primary)' }}>Prescription Pad</h2>
                  {activeAppt.prescription_id && (
                     <span style={{ padding: '6px 12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Saved</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Clinical Diagnosis</label>
                    <input 
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', fontSize: '1.1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', outline: 'none' }}
                      value={diagnosis} 
                      onChange={e => setDiagnosis(e.target.value)} 
                      placeholder="E.g., Acute Pharyngitis" 
                      disabled={!!activeAppt.prescription_id} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Medications</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {medications.map((m, i) => (
                        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: isMobile ? 16 : 20, borderRadius: 'var(--radius)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1 }}>
                              <MedicineAutocomplete
                                value={m.drugName}
                                disabled={!!activeAppt.prescription_id}
                                onChange={(v) => { const nm = [...medications]; nm[i].drugName = v; setMedications(nm); }}
                                onSelect={(med: MedicineSuggestion) => {
                                  const nm = [...medications];
                                  nm[i].drugName = med.name;
                                  if (!nm[i].dose && med.strengths.length > 0) nm[i].dose = med.strengths[0];
                                  setMedications(nm);
                                }}
                              />
                            </div>
                            {!activeAppt.prescription_id && medications.length > 1 && (
                              <button 
                                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}
                                onClick={() => {
                                  const nm = [...medications];
                                  nm.splice(i, 1);
                                  setMedications(nm);
                                }}
                                title="Remove Medicine"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Dose</label>
                              <input style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} placeholder="e.g. 500mg" value={m.dose} onChange={e => { const nm = [...medications]; nm[i].dose = e.target.value; setMedications(nm); }} disabled={!!activeAppt.prescription_id} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Frequency</label>
                              <input style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} placeholder="e.g. 1-0-1" value={m.frequency} onChange={e => { const nm = [...medications]; nm[i].frequency = e.target.value; setMedications(nm); }} disabled={!!activeAppt.prescription_id} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Duration</label>
                              <input style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} placeholder="e.g. 5 days" value={m.duration} onChange={e => { const nm = [...medications]; nm[i].duration = e.target.value; setMedications(nm); }} disabled={!!activeAppt.prescription_id} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!activeAppt.prescription_id && (
                      <button 
                        style={{ marginTop: 16, background: 'none', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', padding: '12px', width: '100%', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => setMedications([...medications, { drugName: '', dose: '', frequency: '', duration: '', instructions: '' }])}
                      >
                        + Add Another Medicine
                      </button>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Advice & Instructions</label>
                    <textarea 
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', fontSize: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', outline: 'none', minHeight: 100 }}
                      value={advice} 
                      onChange={e => setAdvice(e.target.value)} 
                      placeholder="E.g., Drink warm water, rest for 2 days" 
                      disabled={!!activeAppt.prescription_id} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 24 }}>
                    {!activeAppt.prescription_id ? (
                      <button 
                        className={`btn ${savingRx ? 'loading' : ''}`} 
                        style={{ background: 'var(--primary)', color: 'white', padding: '12px 32px', fontSize: '1.1rem', flex: 1 }}
                        onClick={handleSaveRx} 
                        disabled={savingRx || medications[0].drugName === ''}
                      >
                        Sign & Issue Prescription
                      </button>
                    ) : (
                      <a href={`${API_BASE}/prescriptions/${activeAppt.prescription_id}/pdf`} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--border)', padding: '12px 32px', fontSize: '1.1rem', flex: 1, textAlign: 'center' }}>
                        View Issued PDF
                      </a>
                    )}
                    
                    <button 
                      className={`btn ${completing ? 'loading' : ''}`} 
                      style={{ background: 'var(--text-primary)', color: 'var(--bg)', padding: '12px 32px', fontSize: '1.1rem' }} 
                      onClick={handleComplete} 
                      disabled={completing}
                    >
                      End Consultation
                    </button>
                  </div>
                </div>
              </section>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
            <div style={{ maxWidth: 400, textAlign: 'center' }}>
              <div style={{ 
                width: 80, height: 80, margin: '0 auto 24px', 
                background: 'var(--surface-raised)', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontSize: '2rem'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: 12 }}>Your workspace is ready.</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
                Select a patient from the sidebar to view their AI Briefing, clinical history, and start the consultation.
              </p>
              
              {!sidebarOpen && (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  style={{ marginTop: 32, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '12px 24px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)' }}
                >
                  View Appointments
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
