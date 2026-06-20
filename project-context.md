# CURO Project Context

## A. Project Overview

CURO is a consultation workflow platform designed for independent doctors and small clinics. It bridges the gap between patient booking, online/in-person consults, prescription writing, automated follow-ups, and patient health history aggregation (the "health thread").

This document serves as a living record of the project's development state, detailing what is currently built and verified, and what remains outstanding in comparison to the [CURO_PRD_v1.0.md](file:///c:/Users/USER/Desktop/Curo/CURO_PRD_v1.0.md).

---

## B. Architecture State

- **Frontend:** Single Page Application built with **Vite + React + TypeScript**. Styling uses a custom fluid theme (`src/styles.css`) with HSL color system (stone backgrounds, teal highlights, smooth borders, micro-animations).
- **Backend:** **Node.js + Express + TypeScript** server using `tsx` watcher. Feature-organized folders with routers, Zod schemas, and database service adapters.
- **Database:** **PostgreSQL via Supabase** using connection pooler (port 6543, pgBouncer). Schema fully migrated via `npm run db:migrate`.
- **Migrations:** `001_initial_schema.sql` (base) + `002_patient_onboarding.sql` (patient fields + restriction columns).
- **Run Modes:**
  - **Offline/Demo Mode:** Frontend probes `/api/v1/health` with 1.5s timeout. If offline, any 10-digit number + OTP `123456` → demo session. New patient demo sessions go to `/patient-onboarding`.
  - **Full Connected Mode:** Backend is running → real DB auth, onboarding, dashboard, and patient profile.
- **Environment:** `.env` uses Connection Pooler URI with URL-encoded password. Twilio configured for India (+91); `OTP_PROVIDER=console` prints OTPs to terminal during development.

---

## C. Feature Implementation Truth Map

| Feature Area | Frontend UI | Backend Routes | DB Integration |
| :--- | :--- | :--- | :--- |
| **Auth (OTP + JWT)** | ✅ Complete | ✅ Complete | ✅ Live |
| **Doctor Registration** | ✅ Complete | ✅ Complete | ✅ Live |
| **Doctor Onboarding (4 steps)** | ✅ Complete — API wired | ✅ Profile + fees + schedule | ✅ Live |
| **Doctor Dashboard** | ✅ Complete — real API | ✅ Aggregation queries | ✅ Live |
| **Doctor Schedule** | ✅ Complete — real API | ✅ Schedule + blocked dates | ✅ Live |
| **Patient Signup + Onboarding** | ✅ Complete — `/patient-onboarding` | ✅ `POST /patients/me/onboarding` | ✅ Live |
| **Patient Profile (editable)** | ✅ Complete — `/patient-profile` | ✅ `GET/PUT /patients/me` | ✅ Live |
| **Patient Records** | ✅ Real API (tabs: overview, Rx, reports) | ✅ `GET /patients/me/records` | ✅ Live |
| **Role-based Routing** | ✅ Doctor/Patient guards enforced | — | — |
| **Admin Verification** | 🔒 ADMIN role only | ✅ Queue endpoint scaffolded | ⏳ Phase 4 |
| **Patient Booking** | 🔶 UI scaffolded | 🔶 Schema ready | ⏳ Phase 3 |
| **Consultation Flow** | 🔶 Empty state shown | 🔶 Schema ready | ⏳ Phase 3 |
| **Prescription Builder** | 🔶 Empty state shown | 🔶 Schema ready | ⏳ Phase 3 |
| **Health Threads (doctor view)** | 🔶 Empty state shown | 🔶 Aggregation query ready | ⏳ Phase 3 |
| **Payments / Payouts** | 🔶 Scaffolded | 🔶 Schema ready | ⏳ Phase 4 |
| **Notifications** | 🔶 Scaffolded | 🔶 Schema ready | ⏳ Phase 4 |

---

## D. What is Built & Verified

### 1. Database (PostgreSQL — Supabase)

**Migration 001 — Base schema:**
`users`, `otp_codes`, `refresh_tokens`, `doctors`, `doctor_verification_history`, `consultation_types`, `doctor_schedules`, `doctor_schedule_breaks`, `doctor_blocked_dates`, `doctor_settings`, `patients`, `appointments`, `prescriptions`, `prescription_medications`, `payments`, `documents`, `notifications`, `health_thread_events`.

**Migration 002 — Patient onboarding columns:**
- `users.mobile_changed_at TIMESTAMPTZ` — for 14-day phone change cooldown (Phase 4)
- `users.email_changed_at TIMESTAMPTZ` — for 14-day email change cooldown
- `patients.onboarding_complete BOOLEAN DEFAULT false` — true after name/gender/age set
- `patients.gender_locked BOOLEAN DEFAULT false` — true after gender is first set
- `patients.age_locked BOOLEAN DEFAULT false` — true after age is first set

### 2. Auth System
- Twilio SMS OTP (India, +91) with console fallback
- Bcrypt-hashed OTP, 5-min expiry, brute-force limit
- JWT access token (15min) + rotating refresh token (30 days)
- Role-locked login: `DOCTOR` vs `PATIENT`
- Auth response includes `onboardingComplete`, `needsOnboarding`, `gender`, `age` for patients

### 3. Doctor Onboarding (Root Cause Fixed)
See [walkthrough.md](file:///C:/Users/USER/.gemini/antigravity-ide/brain/71307e17-f7ed-48b7-9a89-1c0b83b33ad9/walkthrough.md) for full details. All 3 steps now call real backend APIs.

### 4. Patient Signup & Onboarding Flow (NEW — Phase 2.5)

**Problem fixed:** Patients were being routed to `/doctor-onboarding` due to:
- No role guard on the doctor-onboarding route
- New patients had no onboarding step so `needsOnboarding` was undefined/falsy and navigation went to `/records` immediately, but patients hitting any protected route had no way to discover their role mismatch.

**Solution:**
1. `RequireDoctor` guard component — redirects non-doctors to `/records`
2. `RequirePatient` guard component — redirects non-patients to `/dashboard`
3. All doctor-only routes now wrapped: `/dashboard`, `/doctor-onboarding`, `/doctor-schedule`, `/consultations`, `/health-threads`, `/patient-thread/:id`
4. Patient-only routes wrapped: `/patient-onboarding`, `/patient-profile`

**Post-signup redirect logic:**
- Doctor → `/dashboard`
- New patient (`isNewUser=true`) or patient with incomplete profile (`needsOnboarding=true`) → `/patient-onboarding`
- Returning patient (profile complete) → `/records`
- Already logged-in patient with `onboardingComplete === false` → `/patient-onboarding` (on page load)

### 5. Patient Onboarding (`POST /patients/me/onboarding`)
- One-time call: saves `fullName`, `gender`, `age`
- Sets `onboarding_complete = true`, `gender_locked = true`, `age_locked = true`
- Returns `{ success: false, message: 'Profile has already been set up.' }` if called again
- Frontend: updates localStorage immediately so sidebar shows correct name without re-login

### 6. Patient Profile Restrictions (enforced on both frontend + backend)

| Field | Rule |
|---|---|
| **Name** | Always editable |
| **Gender** | One-time editable — read-only in `PatientProfilePage` if `gender_locked = true` |
| **Age** | One-time editable — read-only in `PatientProfilePage` if `age_locked = true` |
| **Email** | Editable, but locked for 14 days after last change (`email_changed_at`) |
| **Mobile** | Read-only on frontend (admin-only change) |
| **Blood Group** | Always editable |
| **Allergies** | Always editable |

Backend enforces all rules even if frontend is bypassed.

### 7. Patient Records Page (`/records`)
- **Patient view:** Real data from `GET /patients/me` + `GET /patients/me/records`
  - Profile card (avatar initials, name, age, gender, blood group, allergies)
  - Tabs: Overview (consultation history) · Prescriptions · Reports
  - Each tab shows real data or a proper empty state with CTA
- **Doctor view:** Redirect message pointing to `/health-threads`

### 8. Navigation

#### Doctor sidebar
- Dashboard · Consultations · Schedule · Prescriptions · Records · Doctor Setup

#### Patient sidebar
- My Records · My Profile · Prescriptions · Book Consultation

#### Admin
- Admin Console (ADMIN role only, never shown to doctors/patients)

---

## E. Profile & Schema Restrictions (Implementation Details)

### Backend enforcement (patients/service.ts)
```typescript
// Gender lock check
if (data.gender !== undefined) {
  if (current.gender_locked) {
    errors.push('Gender can only be updated once after initial profile setup.');
  } else {
    // Set gender_locked = true on save
  }
}

// Email 14-day cooldown
const daysSince = (Date.now() - new Date(userRow.email_changed_at).getTime()) / (1000 * 60 * 60 * 24);
if (daysSince < 14) {
  return { success: false, message: `Email can only be changed once every 14 days. Please wait ${daysLeft} more day(s).` };
}
// Sets email_changed_at = NOW() on update
```

### Frontend enforcement (PatientProfilePage.tsx)
- Gender/Age fields rendered as read-only `<input>` if `profile.gender_locked / age_locked = true`
- Email field disabled + shows cooldown message if `email_changed_at` < 14 days ago
- Error messages from backend displayed inline

---

## F. Key File Locations

| File | Purpose |
|---|---|
| `backend/src/auth/service.ts` | OTP send/verify, JWT issue, refresh logic. Returns `onboardingComplete`, `needsOnboarding` for patients |
| `backend/src/patients/routes.ts` | Patient endpoints incl. `POST /me/onboarding` |
| `backend/src/patients/service.ts` | DB queries: onboarding, profile update with lock enforcement |
| `backend/src/patients/schema.ts` | `PatientOnboardingSchema` + `UpdatePatientProfileSchema` |
| `backend/src/db/migrations/001_initial_schema.sql` | Base schema |
| `backend/src/db/migrations/002_patient_onboarding.sql` | Patient restriction columns |
| `frontend/src/features/patient-profile/components/PatientOnboardingPage.tsx` | One-time patient profile setup form |
| `frontend/src/features/patient-profile/components/PatientProfilePage.tsx` | Patient profile management with restriction UI |
| `frontend/src/features/records/components/RecordsPage.tsx` | Patient health records (real data) |
| `frontend/src/features/auth/AuthContext.tsx` | Auth state, JWT storage, `onboardingComplete` in `AuthUser` |
| `frontend/src/features/auth/LandingPage.tsx` | Post-login routing: doctor/patient/new-patient routing |
| `frontend/src/App.tsx` | Routes with `RequireDoctor` + `RequirePatient` guards |
| `frontend/src/shared/components/AppShell.tsx` | Sidebar nav (doctor vs patient) |
| `frontend/src/shared/api.ts` | All typed API calls incl. `patientApi.completeOnboarding()` |

---

## G. Remaining (Upcoming Phases)

### Phase 3 — Booking Engine + Clinical Workflow
- Slot reservation + hold-before-payment (Razorpay)
- `payment.captured` webhook → activates appointment
- Consultation flow with real patient data
- Prescription builder tied to active appointment
- WhatsApp delivery of Rx via Twilio
- Patient health thread — real data from DB

### Phase 4 — Verification + Payouts + AI
- Admin verification queue UI + approve/reject endpoints
- Doctor activation (booking link enabled on approval)
- Phone number change flow (14-day cooldown, same as email)
- AI Pre-Consult Summary (Gemini API)
- PDF prescription generation + Supabase Storage
- T+2 payout settlement (Razorpay payouts, 2.5% platform fee)
- External NMC validation (real council API)
