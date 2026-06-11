# CURO Project Context

## A. Project Overview

CURO is a consultation workflow platform designed for independent doctors and small clinics. It bridges the gap between patient booking, online/in-person consults, prescription writing, automated follow-ups, and patient health history aggregation (the "health thread").

This document serves as a living record of the project's development state, detailing what is currently built and verified, and what remains outstanding in comparison to the [CURO_PRD_v1.0.md](file:///c:/Users/USER/Desktop/Curo/CURO_PRD_v1.0.md).

---

## B. Architecture State

- **Frontend:** Single Page Application built with **Vite + React + TypeScript**. Styling uses a custom, highly fluid Claude-style light theme (`src/styles.css` and `src/features/auth/landing.css`) centered on an HSL color system (stone backgrounds, teal highlights, smooth borders, and micro-animations). 
- **Backend:** **Node.js + Express + TypeScript** server using `tsx` watcher. Organised into self-contained feature folders containing routers, validation schemas, and service adapters.
- **Database / State:** Core authentication and session state use an in-memory data store with time-to-live (TTL) expiration. PostgreSQL adapters exist as a skeleton connection pool but are not currently wired to the live business logic.
- **Run Modes:**
  - **Offline/Demo Mode:** The frontend probes the backend health endpoint `/api/v1/health` with a 1.5-second timeout. If offline, it acts as a client-side mockup defaulting to OTP `123456` with mock seed user profiles.
  - **Full Connected Mode:** If the backend is running, the frontend integrates with backend route endpoints for registration, login, token refresh, and doctor dashboard metrics.

---

## C. Feature Implementation Truth Map

| Feature Area | Frontend UI | Backend Routes / State | Integration Status |
| :--- | :--- | :--- | :--- |
| **Auth System** | Completed (OTP screens, role selector) | Completed (OTP store, JWT sign/verify) | **Fully Connected** (Graceful offline fallback) |
| **Doctor Onboarding** | Completed (4-step onboarding wizard) | Scaffolded (Registration & details) | Mock Integration |
| **Doctor Dashboard** | Completed (Stats strip, next consult, slots) | Completed (Dashboard endpoint with data) | **Fully Connected** |
| **Schedule / Slots** | Completed (Weekly grid, blocked dates UI) | Scaffolded | Mock Integration |
| **Patient Booking** | Completed (Stepper flow, slot calendar) | Scaffolded | Mock Integration |
| **Consultation Flow** | Completed (Snapshot, AI summary, notes) | Scaffolded | Mock Integration |
| **Prescription Builder** | Completed (Medications grid & PDF builder) | Scaffolded | Mock Integration |
| **Health Threads** | Completed (Timeline layout, search list) | Scaffolded | Mock Integration |
| **Payments / Payouts** | Completed (Mock Razorpay & Payouts list) | Scaffolded | Mock Integration |
| **Admin Panel** | Completed (Verification queue, analytics) | Scaffolded | Mock Integration |
| **Notifications** | Scaffolded / Notification center mockup | Scaffolded | Not Connected |

---

## D. What is Built & Completed

### 1. Unified Authentication System
- **Gamified Landing Page:** Interactive role-selection (Doctor vs. Patient) with fluid CSS spring animations, tabbed login/signup states, multi-dot OTP entry indicators, and success confirmation visual checkmarks.
- **Session Security:** Complete JWT authentication lifecycle including Access Tokens (short-lived), Refresh Tokens (rotating), auto-refresh headers on `401 Unauthorized`, and server-side blacklisting upon `/logout`.
- **Pre-Seeded Mock Roles:** Dedicated accounts registered for verification:
  - Doctor: `9876543210`
  - Patient: `9123456789`
  - Admin: `9000000000`

### 2. Doctor Workspace & Intake View
- **Dashboard:** At-a-glance KPIs (Daily revenue, confirmed appointments count, pending counts), next-up patient highlight, and a color-coded time-slot tracker.
- **Consultation View:** Built-in timer tracker, allergy/history summary tiles, freeform doctor note taking (with draft state), and a standard medications/dosage prescribing grid.
- **Schedule Management:** A customizable visual calendar for editing weekly recurring hours and blocking out date ranges.

### 3. Patient Workspace & Intake Stepper
- **Booking Flow:** Four-step booking setup: Patient Details, Symptoms & Complaint details, Slot Selector (dates and times), and a Checkout summary page with a mockup file upload widget.
- **Health Portal:** Individual patient login showing timeline-based past clinic records, prescriptions, and an option to generate temporary access share links.

### 4. Admin Verification Desk
- **Clinic Dashboard:** Registration verification desk for approving/rejecting doctor applications, complete with simulated stats charts and verification filters.

---

## E. What is Left Out & Remaining (From PRD v1.0.0)

To transition from the current demo/in-memory prototype to a production-ready application, the following items from the PRD are remaining:

### 1. Database & Persistence Layer
- **PostgreSQL Migration:** Implement physical SQL schemas, indices, and Knex/Prisma/Sequelize migrations matching Section 9 of the PRD.
- **Data Persistence:** Replace the temporary in-memory store in `backend/src/shared/store.ts` with real database queries for accounts, bookings, records, and prescriptions.

### 2. External Third-Party API Integrations
- **SMS Gateway (OTP Delivery):** Replace the server-logged OTP simulation with a real provider API (such as MSG91, Twilio, or Firebase Phone Auth).
- **WhatsApp Business API:** Connect automated consultation triggers, payment confirmation messages, and prescription download URLs.
- **Razorpay Payments Checkout:** Connect the live Razorpay API checkouts, configure HMAC signature validation, and handle the `payment.captured` Webhooks to automate booking confirmation status (BR-05/06).
- **Storage Buckets (S3 / GCS):** Connect S3 presigned URLs for patient documents and medical reports, and integrate antivirus/malware file scanners before storage.

### 3. Core Business Logic & Algorithms
- **Dynamic AI Pre-Consult summaries:** Build the LLM pipeline (e.g. OpenAI/Gemini/Anthropic API) that aggregates the patient's intake form and historical health records into a traceable, source-cited summary.
- **Public Booking Slug Resolution:** Support public domain lookup (e.g., `curo.app/dr-arun-sharma`) resolving to a public profile booking page without requiring patient authentication beforehand.
- **Live Consultation Rooms:** Integrate WebRTC or video platform SDKs (e.g., Daily.co, Zoom, or Jitsi) to support virtual consulting features.
- **NMC Doctor Verification:** Connect lookup verification adapters to check medical registration details against NMC or local health council APIs.
- **Cancellation & Payout Rules:** Implement automatic settlement calculations (T+2 settlements, 2.5% platform fee deduction) and policy refunds based on the appointment booking times.
