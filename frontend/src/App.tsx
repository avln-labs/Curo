import { Route, Routes, Navigate } from 'react-router-dom';
import { LandingPage } from './features/auth/LandingPage';
import { DoctorOnboardingPage, DoctorDashboardPage, DoctorSchedulePage } from './features/doctor-onboarding';
import { BookingDetails } from './features/patient-booking/components/BookingDetails';
import { BookingSymptoms } from './features/patient-booking/components/BookingSymptoms';
import { BookingSlotSelection } from './features/patient-booking/components/BookingSlotSelection';
import { BookingPayment } from './features/patient-booking/components/BookingPayment';
import { BookingConfirmation } from './features/patient-booking/components/BookingConfirmation';
import { PatientThreadPage } from './features/patient-thread';
import { ConsultationDashboard } from './features/consultations';
import { PrescriptionPage } from './features/prescriptions';
import { RecordsPage } from './features/records';
import { PaymentPage } from './features/payments';
import { AdminPanel } from './features/admin';
import { HealthThreadPage } from './features/health_threads';
import { HomePage } from './features/home';
import { AppShell } from './shared/components/AppShell';
import { RequireAuth } from './features/auth/AuthContext';

function App() {
  return (
    <Routes>
      {/* Public: landing + booking flow */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/booking/details"      element={<BookingDetails />} />
      <Route path="/booking/symptoms"     element={<BookingSymptoms />} />
      <Route path="/booking/slot"         element={<BookingSlotSelection />} />
      <Route path="/booking/payment"      element={<BookingPayment />} />
      <Route path="/booking/confirmation" element={<BookingConfirmation />} />

      {/* Protected: doctor/patient workspace */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/home"               element={<HomePage />} />
        <Route path="/dashboard"          element={<DoctorDashboardPage />} />
        <Route path="/doctor-onboarding"  element={<DoctorOnboardingPage />} />
        <Route path="/doctor-schedule"    element={<DoctorSchedulePage />} />
        <Route path="/consultations"      element={<ConsultationDashboard />} />
        <Route path="/prescriptions"      element={<PrescriptionPage />} />
        <Route path="/records"            element={<RecordsPage />} />
        <Route path="/payments"           element={<PaymentPage />} />
        <Route path="/admin"              element={<AdminPanel />} />
        <Route path="/health-threads"     element={<HealthThreadPage />} />
        <Route path="/patient-thread/:id" element={<PatientThreadPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
