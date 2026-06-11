import { Link } from 'react-router-dom';
import { useBookingPage } from '../hooks/useBookingPage';

const stepLabels = [
  { id: 'select_doctor', title: 'Select doctor', description: 'Discover a doctor and available consultation slots.' },
  { id: 'fill_details', title: 'Patient details', description: 'Capture patient info and symptoms before confirmation.' },
  { id: 'confirmation', title: 'Confirmation', description: 'Review your booking summary and continue to payment.' },
] as const;

export function BookingPage() {
  const {
    doctors,
    loading,
    step,
    selectedDoctor,
    selectedSlot,
    formValues,
    confirmation,
    setSelectedSlot,
    updateForm,
    selectDoctor,
    nextStep,
    submitForm,
    setStep,
  } = useBookingPage();

  return (
    <main className="page">
      <h1>Patient Booking</h1>
      <p>Book a consultation in a step-by-step patient flow designed for mobile-first access.</p>

      <div className="stepper">
        {stepLabels.map((item) => (
          <div key={item.id} className={`step-item ${step === item.id ? 'active' : ''}`}>
            <p className="step-title">{item.title}</p>
            <p className="step-copy">{item.description}</p>
          </div>
        ))}
      </div>

      {loading && <p>Loading available doctors…</p>}

      {step === 'select_doctor' && (
        <section className="card">
          <h2>Choose a doctor</h2>
          <div className="card-grid">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                type="button"
                className={selectedDoctor?.id === doctor.id ? 'button-card selected' : 'button-card'}
                onClick={() => selectDoctor(doctor)}
              >
                <h3>{doctor.name}</h3>
                <p>{doctor.speciality}</p>
                <p className="stat-note">Next available: {doctor.nextAvailable}</p>
              </button>
            ))}
          </div>

          {selectedDoctor && (
            <div className="card">
              <h3>Available slots for {selectedDoctor.name}</h3>
              <div className="slot-grid">
                {selectedDoctor.availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={slot === selectedSlot ? 'slot selected' : 'slot'}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <div className="button-grid">
                <button disabled={!selectedSlot} onClick={nextStep}>
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 'fill_details' && selectedDoctor && (
        <section className="card form-card">
          <h2>Patient details</h2>
          <label>
            Patient name
            <input value={formValues.patientName} onChange={(event) => updateForm('patientName', event.target.value)} required />
          </label>
          <label>
            Mobile
            <input value={formValues.mobile} onChange={(event) => updateForm('mobile', event.target.value)} required />
          </label>
          <label>
            Symptoms & notes
            <textarea value={formValues.symptoms} onChange={(event) => updateForm('symptoms', event.target.value)} rows={4} />
          </label>

          <div className="summary-box">
            <p>
              {selectedDoctor.name} • <strong>{selectedSlot}</strong>
            </p>
          </div>

          <div className="button-grid">
            <button type="button" onClick={() => setStep('select_doctor')}>
              Back
            </button>
            <button onClick={submitForm} disabled={loading || !formValues.patientName || !formValues.mobile}>
              Confirm booking
            </button>
          </div>
        </section>
      )}

      {step === 'confirmation' && confirmation && (
        <section className="card">
          <h2>Booking confirmation</h2>
          <p>{confirmation.message}</p>
          <ul>
            <li>Booking ID: {confirmation.bookingId}</li>
            <li>Doctor: {confirmation.doctorName}</li>
            <li>Slot: {confirmation.slot}</li>
            <li>Patient: {confirmation.patientName}</li>
          </ul>
          <div className="button-grid">
            <Link className="button-primary" to="/payments">
              Proceed to payment
            </Link>
            <button type="button" onClick={() => setStep('select_doctor')}>
              Book another slot
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
