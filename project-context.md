# CURO: Project Context & Philosophy

## Product Vision
CURO is fundamentally simple: **"One doctor link that handles booking, payment, consultation, and prescription."**

Everything built for CURO must serve this singular workflow. Features that do not directly contribute to a doctor receiving a booking, getting paid, conducting the consultation, or writing a prescription are out of scope for the MVP.

## Completed Features & Progress (as of Current)

### 1. Authentication & Landing
- **Role-Based Login**: Split entry paths for `DOCTOR` and `PATIENT` on the landing page.
- **OTP Verification**: Fully functional OTP flow (via backend simulation) that seamlessly creates accounts or recognizes returning users.
- **Animated FAQ**: A premium, `framer-motion` powered accordion FAQ component on the landing page featuring magnetic hover effects, frosted glass UI, and spring physics.

### 2. Doctor Onboarding Wizard
- **Step-by-Step Flow**: New doctors are routed to an onboarding wizard before accessing the dashboard.
- **Professional Details**: Captures Name, Specialization, Undergraduate degree, Postgraduate degree (with dynamic validation so e.g. BDS cannot select MD), Languages spoken, and Experience.
- **Consultation Setup**: Captures standard fees and UPI QR Code for offline/manual payment flows.
- **Schedule Configuration**: Allows doctors to set default working hours.

### 3. Doctor Dashboard & Profile
- **"Liquid Glass" UI**: The consultation workspace and sidebar are designed with a stunning "Apple Liquid Glass" aesthetic (translucent background, heavy backdrop blur, premium typography).
- **Interactive Product Tour**: Implemented `driver.js` to provide a guided walk-through of the dashboard features. The tour popups are entirely restyled to match the liquid glass aesthetic and tracked per-user to prevent overlapping.
- **Profile Management**: Doctors can edit their Professional profile (education, bio, languages, experience) post-onboarding via the settings page.

### 4. Custom Booking Engine (Backend)
- Dynamic calculation of available slots in real-time, handling overlaps and breaks, all backed by PostgreSQL instead of relying on third-party tools like Cal.com.

## The MVP Scope
**A doctor can:**
1. Sign up using OTP & Complete Onboarding. *(Implemented)*
2. Configure basic clinic details, consultation fees, and working hours. *(Implemented)*
3. Share a single public booking link. *(Implemented)*
4. Conduct consultations via Google Meet.
5. Generate and share PDF prescriptions.

**A patient can:**
1. Open the doctor's link.
2. Login with OTP.
3. Select an available slot.
4. Pay for the consultation (via UPI/Razorpay integration).
5. Join the video consultation.
6. Receive and download their prescription.

*Explicitly Out of Scope for MVP:*
- AI Scribes or Chatbots
- Health Threads / Secure messaging
- NMC / Medical council automated validation
- Advanced profile restrictions
- Automated payouts / split routing (Phase 3+)
- Complex multi-clinic management

## Core Architecture

### Tech Stack
- **Frontend:** React (Vite) + TypeScript + Framer Motion
- **Styling:** Custom CSS (`styles.css`) focusing on "Editorial Minimalism" (No Tailwind)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (managed by Supabase)
- **Auth:** JWT with OTP 
- **Payments:** UPI (Manual via QR) & Razorpay

### Authentication Flow
- **OTP Based:** Both Doctors and Patients use mobile OTP to sign in.
- **Roles:** The system enforces strict role boundaries (`DOCTOR` vs `PATIENT`).
- **Profile Initialization:** The auth service ensures that upon successful OTP verification for a new user, their corresponding profile row (`doctors` or `patients`) is immediately initialized to prevent dangling accounts, followed by forced onboarding routing based on `onboarding_step` states.

## Design Aesthetics
- **Modern & Premium:** High contrast, frosted glassmorphism, subtle drop shadows, smooth micro-interactions (e.g. `framer-motion` springs).
- **Responsive:** Mobile-first approach since patients primarily book on phones.
- **Colors & Typography:** Tailored CSS custom properties (`--bg: #faf9f5;`), modern sans-serif fonts (Inter), and editorial serif fonts (Playfair Display). No generic system defaults.
