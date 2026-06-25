# CURO: Project Context & Philosophy

## Product Vision
CURO is fundamentally simple: **"One doctor link that handles booking, payment, consultation, and prescription."**

Everything built for CURO must serve this singular workflow. Features that do not directly contribute to a doctor receiving a booking, getting paid, conducting the consultation, or writing a prescription are out of scope for the MVP.

## The MVP Scope
**A doctor can:**
1. Sign up using OTP.
2. Configure basic clinic details, consultation fees, and working hours.
3. Share a single public booking link.
4. Conduct consultations via Google Meet.
5. Generate and share PDF prescriptions.

**A patient can:**
1. Open the doctor's link.
2. Login with OTP.
3. Select an available slot.
4. Pay for the consultation (via Razorpay integration).
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
- **Frontend:** React (Vite) + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (managed by Supabase)
- **Auth:** JWT with OTP via fast2sms (or similar local provider, with in-memory fallbacks)
- **Payments:** Razorpay

### Custom Booking Engine (MVP)
To minimize dependencies and simplify the architecture for the MVP, CURO uses a custom PostgreSQL-backed scheduling engine rather than external integrations like Cal.diy.

1. **Availability & Slots:** Doctors configure their weekly schedule, slot durations, and blocked dates in CURO. The backend dynamically calculates available slots in real-time, handling overlaps and breaks.
2. **Booking Flow:** When a patient books through the Doctor's Public Link or by scanning the Doctor's QR Code, CURO creates a pending appointment.
3. **Payments:** Patients make payments manually via UPI (by scanning the Doctor's uploaded UPI QR Code) and submit a UTR number.
4. **Google Meet Integration:** For online consultations, doctors can connect their Google account. CURO automatically creates a Google Calendar event and generates a Google Meet link when a patient confirms booking/payment.

### Authentication Flow
- **OTP Based:** Both Doctors and Patients use mobile OTP to sign in.
- **Roles:** The system enforces strict role boundaries (`DOCTOR` vs `PATIENT`).
- **Profile Creation:** The auth service ensures that upon successful OTP verification for a new user, their corresponding profile row (`doctors` or `patients`) is immediately initialized to prevent dangling accounts.

## Design Aesthetics
- **Modern & Premium:** High contrast, glassmorphism, smooth micro-interactions.
- **Responsive:** Mobile-first approach since patients primarily book on phones.
- **Colors & Typography:** Tailored HSL colors, modern sans-serif fonts (e.g., Inter, Outfit). No generic system defaults.
