# CURO Project Context

## A. Project Overview

CURO is a consultation workflow platform designed for independent doctors and small clinics. It bridges the gap between patient booking, online/in-person consults, prescription writing, automated follow-ups, and patient health history aggregation (the "health thread").

This document serves as a living record of the project's development state, detailing what is currently built and verified, and what remains outstanding in comparison to the [CURO_PRD_v1.0.md](file:///c:/Users/USER/Desktop/Curo/CURO_PRD_v1.0.md).

---

## B. Architecture State

- **Frontend:** Single Page Application built with **Vite + React + TypeScript**. Styling uses a custom fluid theme (`src/styles.css`) with HSL color system (stone backgrounds, teal highlights, smooth borders, micro-animations).
- **Backend:** **Node.js + Express + TypeScript** server using `tsx` watcher. Feature-organized folders with routers, Zod schemas, and database service adapters.
- **Database:** **PostgreSQL via Supabase** using connection pooler (port 6543, pgBouncer). Schema fully migrated via `npm run db:migrate`.
- **Run Modes:**
  - **Offline/Demo Mode:** Frontend probes `/api/v1/health` with 1.5s timeout. If offline, any 10-digit number + OTP `123456` creates a generic demo session.
  - **Full Connected Mode:** Backend is running → real DB auth, onboarding, and dashboard metrics.
- **Environment:** `.env` uses Connection Pooler URI with URL-encoded password. Twilio is configured for India (+91); `OTP_PROVIDER=console` prints OTPs to terminal during development.

---

## C. Feature Implementation Truth Map

| Feature Area | Frontend UI | Backend Routes | DB Integration |
| :--- | :--- | :--- | :--- |
| **Auth (OTP + JWT)** | ✅ Complete | ✅ Complete | ✅ Live |
| **Doctor Registration** | ✅ Complete | ✅ Complete | ✅ Live |
| **Doctor Onboarding (4 steps)** | ✅ Complete — API wired | ✅ 3 steps + profile endpoint | ✅ Live (saves to `doctor_profiles`) |
| **Doctor Dashboard** | ✅ Complete — real API | ✅ Aggregation queries | ✅ Live |
| **Doctor Schedule** | ✅ Complete — real API | ✅ Schedule + blocked dates | ✅ Live |
| **Admin Verification** | 🔒 Internal only (ADMIN role) | ✅ Queue endpoint scaffolded | Pending Phase 4 |
| **Patient Booking** | 🔶 UI scaffolded | 🔶 Schema ready | ⏳ Phase 3 |
| **Consultation Flow** | 🔶 Empty state shown | 🔶 Schema ready | ⏳ Phase 3 |
| **Prescription Builder** | 🔶 Empty state shown | 🔶 Schema ready | ⏳ Phase 3 |
| **Health Threads** | 🔶 Empty state shown | 🔶 Aggregation query ready | ⏳ Phase 3 |
| **Payments / Payouts** | 🔶 Scaffolded | 🔶 Schema ready | ⏳ Phase 4 |
| **Notifications** | 🔶 Scaffolded | 🔶 Schema ready | ⏳ Phase 4 |

---

## D. What is Built & Verified (Phase 1 + Phase 2 Fixes)

### 1. Database (PostgreSQL — Supabase)
- Full schema with `users`, `doctors`, `doctor_profiles`, `doctor_settings`, `doctor_consultation_types`, `doctor_schedules`, `blocked_dates`, `patients`, `appointments`, `prescriptions`, `payments`, `notifications`, `health_thread_events`.
- Migration runner: `npm run db:migrate`

### 2. Auth System
- Twilio SMS OTP (India, +91) with console fallback
- Bcrypt-hashed OTP, 5-min expiry, brute-force limit
- JWT access token (15min) + rotating refresh token (30 days)
- Role-locked login: `DOCTOR` vs `PATIENT`

### 3. Doctor Onboarding (Root Cause Fixed in Phase 2)
**Root cause of empty profiles:** The 4-step onboarding wizard was purely local React state — no API calls. Every "Next →" button just called `setStep()`. Backend endpoints existed but were never called.

**Fix applied:**
- Step 1 → `POST /doctors/onboarding/profile` (sends `qualifications[]`, `specialisations[]`, `languages[]` as proper arrays)
- Step 2 → `POST /doctors/onboarding/fees`
- Step 3 → `POST /doctors/onboarding/schedule`
- Step 4 → Submit for verification (Phase 4: Razorpay payouts)
- On mount: `GET /doctors/profile` restores saved state, resumes at correct step
- Verification status banners: Pending ⏳ / Verified ✅ / Rejected ❌ (with rejection reason + resubmit flow)

### 4. Demo Data Removed
All hardcoded mock data removed from the frontend:
- `DoctorDashboardPage.tsx` — real API
- `DoctorSchedulePage.tsx` — real API
- `DoctorOnboardingPage.tsx` — real API + blank forms
- `ConsultationDashboard.tsx` — proper empty state
- `RecordsPage.tsx` — proper empty state
- `PrescriptionPage.tsx` — proper empty state
- `HealthThreadPage.tsx` — proper empty state
- `useHomePage.ts` — no hardcoded stats, role-aware links only
- `AppShell.tsx` — Admin Console hidden from doctors

### 5. Navigation
- Admin Console is ADMIN-only (not visible to doctors/patients)
- Doctor sidebar: Dashboard · Consultations · Schedule · Prescriptions · Records · Doctor Setup
- Patient sidebar: My Records · Appointments · Prescriptions

---

## E. Remaining (Upcoming Phases)

### Phase 3 — Booking Engine + Clinical Workflow
- Slot reservation + hold-before-payment
- Razorpay checkout order creation + `payment.captured` webhook → activates appointment
- Consultation flow with real patient data
- Prescription builder tied to active appointment
- WhatsApp delivery of Rx via Twilio
- Patient health thread — real data from DB

### Phase 4 — Verification + Payouts + AI
- Admin verification queue UI + approve/reject endpoints
- Doctor receives approval/rejection + reads updated status on onboarding page
- AI Pre-Consult Summary (Gemini API)
- PDF prescription generation + Supabase Storage
- T+2 payout settlement (Razorpay payouts, 2.5% platform fee)
- External NMC validation (real council API)

---

## F. Key File Locations

| File | Purpose |
|---|---|
| `backend/src/auth/service.ts` | OTP send/verify, JWT issue, refresh logic |
| `backend/src/doctors/routes.ts` | All doctor endpoints (onboarding + profile + dashboard + schedule) |
| `backend/src/doctors/service.ts` | DB queries for all doctor data |
| `backend/src/doctors/schema.ts` | Zod schemas (expects arrays for qualifications, specialisations, languages) |
| `frontend/src/features/doctor-onboarding/components/DoctorOnboardingPage.tsx` | 4-step wizard, API-wired |
| `frontend/src/features/doctor-onboarding/components/DoctorDashboardPage.tsx` | Live dashboard from API |
| `frontend/src/features/doctor-onboarding/components/DoctorSchedulePage.tsx` | Live schedule from API |
| `frontend/src/shared/api.ts` | All typed API calls |
| `frontend/src/features/auth/AuthContext.tsx` | Auth state, JWT storage, fullName mapping |
| `backend/.env` | DB connection pooler URL, Twilio, JWT secret |
