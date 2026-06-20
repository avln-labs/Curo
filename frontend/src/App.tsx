import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
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
import { PatientOnboardingPage, PatientProfilePage } from './features/patient-profile';
import { AppShell } from './shared/components/AppShell';
import { RequireAuth, useAuth } from './features/auth/AuthContext';

/**
 * RequireDoctor — redirects patients/admins away from doctor-only routes.
 * Patients get sent to /records. Non-authenticated users get sent to /.
 */
function RequireDoctor({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/" replace state={{ from: location }} />;
  if (user.role !== 'DOCTOR') return <Navigate to="/records" replace />;
  return <>{children}</>;
}

/**
 * RequirePatient — redirects doctors/admins away from patient-only routes.
 */
function RequirePatient({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/" replace state={{ from: location }} />;
  if (user.role !== 'PATIENT') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

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

      {/*
        Patient onboarding — standalone (no AppShell sidebar).
        Shown once after new patient signup.
        Protected: requires auth + PATIENT role.
      */}
      <Route
        path="/patient-onboarding"
        element={
          <RequireAuth>
            <RequirePatient>
              <PatientOnboardingPage />
            </RequirePatient>
          </RequireAuth>
        }
      />

      {/* Protected: workspace with AppShell sidebar */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/home"               element={<HomePage />} />

        {/* ── Doctor-only routes ───────────────────────────────────── */}
        <Route path="/dashboard"          element={<RequireDoctor><DoctorDashboardPage /></RequireDoctor>} />
        <Route path="/doctor-onboarding"  element={<RequireDoctor><DoctorOnboardingPage /></RequireDoctor>} />
        <Route path="/doctor-schedule"    element={<RequireDoctor><DoctorSchedulePage /></RequireDoctor>} />
        <Route path="/consultations"      element={<RequireDoctor><ConsultationDashboard /></RequireDoctor>} />
        <Route path="/health-threads"     element={<RequireDoctor><HealthThreadPage /></RequireDoctor>} />
        <Route path="/patient-thread/:id" element={<RequireDoctor><PatientThreadPage /></RequireDoctor>} />

        {/* ── Shared routes (doctor + patient) ────────────────────── */}
        <Route path="/prescriptions"      element={<PrescriptionPage />} />
        <Route path="/records"            element={<RecordsPage />} />
        <Route path="/payments"           element={<PaymentPage />} />

        {/* ── Patient-only routes ──────────────────────────────────── */}
        <Route path="/patient-profile"    element={<RequirePatient><PatientProfilePage /></RequirePatient>} />

        {/* ── Admin-only routes ────────────────────────────────────── */}
        <Route path="/admin"              element={<AdminPanel />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
