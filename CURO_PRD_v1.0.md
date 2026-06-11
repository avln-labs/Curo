# CURO — Product Requirements Document
**Version:** 1.0.0  
**Status:** Implementation Ready  
**Last Updated:** June 2026  
**Classification:** Internal — Engineering & Product

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Roles & Personas](#3-user-roles--personas)
4. [Functional Requirements](#4-functional-requirements)
5. [User Stories & Acceptance Criteria](#5-user-stories--acceptance-criteria)
6. [Business Rules & Validations](#6-business-rules--validations)
7. [Edge Cases & Error Handling](#7-edge-cases--error-handling)
8. [API Specifications](#8-api-specifications)
9. [Database Schema](#9-database-schema)
10. [Notification System](#10-notification-system)
11. [Video Consultation](#11-video-consultation)
12. [Payment & Billing](#12-payment--billing)
13. [Admin Panel](#13-admin-panel)
14. [Analytics & Tracking](#14-analytics--tracking)
15. [Security Requirements](#15-security-requirements)
16. [Technical Architecture](#16-technical-architecture)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [MVP Scope & Future Enhancements](#18-mvp-scope--future-enhancements)

---

## 1. Executive Summary

CURO is a consultation workflow platform for independent doctors and small clinics. It removes operational friction from the consultation lifecycle — booking, payment, patient intake, AI-assisted preparation, digital prescriptions, and longitudinal health records — without replacing the doctor's existing practice style.

The platform serves three primary actors: **Doctors** (who set up and manage consultations), **Patients** (who book, pay, and access their records), and **Admins** (who manage platform integrity). The core differentiator is that CURO functions as the doctor's persistent patient memory layer — each consultation enriches a longitudinal health thread that travels with the patient, compounding value over time.

**MVP Target:** 3 months to production  
**Initial Market:** Independent general physicians, India  
**Monetisation (MVP):** Per-transaction fee (2.5% of consultation fee, min ₹10) + optional SaaS subscription for premium features

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

> "Give every independent doctor a private, intelligent operational layer — so they spend less time coordinating and more time consulting."

### 2.2 Strategic Goals

| Goal | Success Metric | Target (6 months post-launch) |
|------|---------------|-------------------------------|
| Remove WhatsApp-based payment coordination | % of bookings completed without manual payment confirmation | >90% |
| Reduce pre-consult information-gathering time | Average consult time saved per doctor per day | >15 minutes |
| Increase patient record continuity | % of returning patients with structured history | >70% |
| Platform adoption | Paying doctors on platform | 500 |
| Patient booking conversions | Booking page visit → confirmed booking | >40% |

### 2.3 Design Principles

- **Preserve, don't replace:** Doctors continue owning patient relationships and consultation methods
- **Zero-friction onboarding:** A doctor must be able to go from signup to a live booking link in under 5 minutes
- **Trust through transparency:** AI-generated content always cites its source and is editable
- **Mobile-first:** Both doctor and patient interfaces are designed for a 375px viewport first
- **Offline-tolerant:** Core consultation and prescription flows work with degraded connectivity

---

## 3. User Roles & Personas

### 3.1 Role Definitions

```
SUPER_ADMIN      — Full platform access, billing, compliance
ADMIN            — Platform operations, dispute resolution, doctor verification
DOCTOR           — Manages own clinic profile, consultations, patients, prescriptions
CLINIC_STAFF     — Assistant role within a doctor's account (view schedules, manage slots)
PATIENT          — Books consultations, uploads documents, views own records
ANONYMOUS        — Views public booking page, no authentication required
```

### 3.2 Role-Permission Matrix

| Action | SUPER_ADMIN | ADMIN | DOCTOR | CLINIC_STAFF | PATIENT |
|--------|------------|-------|--------|--------------|---------|
| Manage any doctor profile | ✓ | ✓ | — | — | — |
| Manage own doctor profile | ✓ | ✓ | ✓ | — | — |
| View doctor's patients | ✓ | ✓ | Own only | Own doctor's | — |
| Create/edit consultation | ✓ | — | Own only | View only | — |
| Write prescription | — | — | ✓ | — | — |
| View own health records | — | — | — | — | ✓ |
| Share health records | — | — | — | — | ✓ |
| Process refunds | ✓ | ✓ | — | — | — |
| View analytics | ✓ | ✓ | Own only | — | — |
| Manage platform settings | ✓ | — | — | — | — |

### 3.3 Primary Personas

**Dr. Arun Sharma** — Independent GP, 38, Pune. Sees 15–20 patients/day. Currently uses WhatsApp + UPI + paper Rx. Pain: admin burden, no structured patient history, payment chasing.

**Rohan Kumar** — Patient, 34, Mumbai. Prefers remote consultations. Pain: repeating symptoms each visit, losing prescriptions, no record of past consults.

**Clinic Admin (Priya)** — Assistant to Dr. Sharma. Manages scheduling. Pain: phone-based booking, manual payment verification.

---

## 4. Functional Requirements

### 4.1 Doctor Onboarding & Setup

#### 4.1.1 Registration

- Doctor registers with mobile number + email
- OTP verification on mobile (primary) and email (secondary)
- Post-OTP, doctor completes a 4-step setup wizard (as shown in UX: Clinic Details → Consultation Fees → Available Slots → Payment Setup)
- Progress is persisted server-side; doctor can resume from any step
- Booking link is provisioned at step 1 completion: `curo.app/[slug]`
- Slug auto-generated from doctor name; doctor can customise (alphanumeric, hyphens, 3–40 chars, unique)
- Setup can be completed in background; booking link is live only after step 4 (payment setup) is complete

#### 4.1.2 Clinic Profile

Required fields:
- Full name (as per medical registration)
- Specialisation(s) — multi-select from taxonomy
- Medical registration number (MCI/State Council)
- Registration council name
- Clinic name (optional)
- City / location (for in-person)
- Profile photo (JPEG/PNG, max 5MB)
- Languages spoken
- Qualifications (MBBS, MD, etc.)
- Bio (max 500 characters)

Verification:
- Registration number format-validated at input
- Async backend verification queued against NMC API (where available) or manual review
- Unverified doctors show "Pending verification" badge; booking link inactive
- Verified doctors show "Verified" badge (green)
- Admin can manually approve/reject with reason

#### 4.1.3 Consultation Fees & Types

- Doctor configures multiple consultation types:
  - **Online consultation** — fee in INR, duration in minutes (default 15)
  - **In-person consultation** — fee in INR, duration in minutes (default 20)
  - **Follow-up consultation** — reduced fee, selectable discount % or flat amount
- Fees must be between ₹50 and ₹50,000
- Doctor can mark any consultation type as inactive (hides from booking page)

#### 4.1.4 Schedule & Slot Management

- Doctor sets weekly recurring schedule (day + time blocks)
- Each working day: start time, end time, lunch/break blocks
- Slot duration derived from consultation type (e.g., 15-min slots)
- Buffer time between appointments (0–30 min, configurable)
- Max patients per day (hard cap)
- Doctor can block specific dates (holidays, leaves) — single date or date range
- Schedule changes affect only future unboooked slots; confirmed bookings are not auto-cancelled
- Slots displayed in IST; system stores in UTC

#### 4.1.5 Payment Setup

- Razorpay linked account onboarding
- Doctor provides:
  - Bank account number + IFSC (validated via penny-drop)
  - PAN number (for TDS compliance)
  - GST number (optional; required if annual billings >₹20L)
- Platform deducts transaction fee before settlement
- Settlement cycle: T+2 business days
- Doctor can view payout history in dashboard

### 4.2 Doctor Dashboard

#### 4.2.1 Daily Overview

As per UX design, the dashboard shows:

- **Header:** Current date, count of upcoming appointments
- **Stats bar:** Today's confirmed count, total collected (INR), pending payments count
- **Next consult card:** Patient avatar, name, age/gender, chief complaint, AI brief, CTA buttons ("View full notes" / "Start consult")
- **Today's list:** Ordered by time; each row shows avatar, name, complaint type (Online/In-person), time, status badge
  - Status values: `Confirmed` | `Payment due` | `In progress` | `Completed` | `Cancelled` | `No-show`
- **Slot overview:** Visual grid of today's slots — colour-coded: available / taken / next up

#### 4.2.2 Weekly & Monthly Views

- Calendar view (week) with appointment density heatmap
- Monthly revenue graph (bar chart: collection vs refunds)
- Top complaints by frequency (last 30 days)

#### 4.2.3 Search & Filters

- Search patients by name, phone, or CURO patient ID
- Filter by: date range, consultation type, status, payment status

### 4.3 Consultation Flow (Doctor Side)

#### 4.3.1 Pre-Consult View

Accessible when doctor taps "View full notes" on a confirmed appointment:

- **Patient snapshot card:**
  - Name, age, gender
  - Blood group (if provided)
  - Known allergies (if provided)
  - History pills: past prescriptions (drug name + date), past uploaded reports (name + date)

- **AI pre-consult summary:**
  - Generated text (≤200 words)
  - Source attribution footer: lists each data source used ("intake form today · consult note Apr 7, 2025")
  - "Edit summary" link — opens editable textarea; edited summaries are saved to consultation record, not fed back to AI model
  - Regenerate button — triggers fresh AI generation

- **Symptoms reported:** Verbatim from patient intake form

- **Uploaded documents:** List with preview (PDF viewer / image lightbox) and download

- **Consult notes:** Freetext textarea (autosaves every 30 seconds to draft)

#### 4.3.2 Active Consultation

- Doctor clicks "Start consult" which:
  - Marks consultation status → `In progress`
  - Records `consultation_started_at` timestamp
  - For online consultations: initiates video room (see Section 11)
- Consultation notes continue autosaving
- Doctor can view patient history in a slide-out panel without leaving consult
- Timer shows elapsed consultation time

#### 4.3.3 Prescription Writing

Fields:
- **Diagnosis** — freetext (required)
- **Medications table** — each row: drug name (autocomplete from formulary), dose, frequency (coded: 1-0-1, 0-0-1 etc.), duration, instructions
  - Add row button; delete row
  - Minimum 1 medication OR "No medication prescribed" checkbox
- **Investigations ordered** — freetext (optional)
- **Advice / instructions** — freetext (optional)
- **Follow-up date** — date picker (optional)

Prescription header (auto-populated, read-only):
- Doctor name, qualifications, registration number
- Date
- Patient name, age, gender
- Consultation ID (for traceability)
- Prescription serial number (sequential per doctor)
- CURO-generated short URL for verification: `curo.app/rx/[id]`

Actions:
- **Send via WhatsApp** — generates PDF, triggers WhatsApp Business API message to patient
- **Save PDF** — generates signed PDF, saves to patient record, returns download link
- **End consult & mark done** — marks consultation `Completed`, triggers post-consult notifications

### 4.4 Patient Booking Flow

This is the public-facing flow at `curo.app/[doctor-slug]`.

#### 4.4.1 Doctor Public Profile Page

Anonymous-accessible. Shows:
- Doctor name, photo, specialisation
- Verified badge (if applicable)
- Fees per consultation type
- Average rating and review count
- Languages spoken
- Next available slot (nearest available)
- "Book consultation" CTA

#### 4.4.2 Step 1 — Patient Details

- For first-time patients: collect name, age, gender, mobile, email
- Mobile OTP verification (required before proceeding)
- Returning patients (identified by mobile): pre-filled, can edit
- Fields: Full name (required), Age (required, 1–120), Gender (required), Mobile (required), Email (optional)

#### 4.4.3 Step 2 — Symptoms & Consultation Type

- **Chief complaint** — freetext (required, max 200 chars)
- **Description** — freetext (optional, max 1000 chars)
- **Duration** — number + unit (days/weeks/months) (required)
- **Consultation type** — Online / In-person selector with fee displayed (required)

#### 4.4.4 Step 3 — Slot Selection

- Calendar shows available dates (greyed-out dates have no slots)
- On date selection: shows available time slots for that date
- Slot appears greyed-out if taken; available slots are tappable
- Selected slot highlighted; patient must confirm before proceeding
- Slot is soft-reserved for 10 minutes during payment (released if payment not completed)

#### 4.4.5 Step 4 — Document Upload & Payment

- **Document upload** (optional):
  - Accepted: PDF, JPEG, PNG, HEIC
  - Max file size: 10MB per file
  - Max 5 files per booking
  - Files are virus-scanned before storage
  - Files stored encrypted in object storage (S3/GCS)

- **Payment:**
  - Razorpay checkout embedded
  - Supported: UPI, Debit/Credit Card, Net Banking, Wallets
  - Amount shown: consultation fee + platform convenience fee (if applicable)
  - GST line if applicable
  - Cancellation policy displayed: "Free cancellation up to 2 hours before your slot. 50% refunded after that. No refund for no-show."

#### 4.4.6 Booking Confirmation

Post-payment success:
- Booking status → `Confirmed`
- Confirmation screen shows timeline: Payment received → Slot booked → Documents shared → Reminder set
- WhatsApp confirmation sent to patient with doctor name, date, time, consultation link (for online)
- WhatsApp notification sent to doctor
- Viral share prompt: "Share curo.app/dr-[slug] with friends"

### 4.5 Patient Records & Health Thread

#### 4.5.1 Patient Portal

Accessible via mobile OTP login (no password required, OTP-only auth for patients):

- **Profile card:** Name, age, gender, blood group (editable), allergies (editable)
- **Consultations list:** Ordered by date, most recent first; each row shows doctor name, complaint, date, type, status, Rx badge
- **Prescriptions:** All prescriptions across all CURO doctors; downloadable PDF
- **Uploaded reports:** All documents uploaded during any booking; viewable and downloadable
- **Share records:** Generates a time-limited, token-authenticated read-only link for sharing with another doctor (expiry: 7 days, 1 view, or patient-revocable)

---

## 5. User Stories & Acceptance Criteria

### 5.1 Doctor Onboarding

---

**US-D01: Doctor completes setup and receives booking link**

*As a doctor, I want to complete my setup and receive a shareable booking link so that patients can book consultations without calling.*

**Acceptance Criteria:**
- AC1: Doctor can register with mobile + OTP in under 60 seconds
- AC2: Slug is auto-generated and available for preview at step 1 completion
- AC3: Booking link is NOT publicly accessible until step 4 (payment setup) is complete
- AC4: Doctor receives WhatsApp + email with their booking link on setup completion
- AC5: Attempting to access an inactive booking link shows a friendly "Booking unavailable" page, not a 404

---

**US-D02: Doctor configures weekly schedule**

*As a doctor, I want to set my weekly recurring availability so that patients can only book during my working hours.*

**Acceptance Criteria:**
- AC1: Doctor can set different hours per day of the week
- AC2: Doctor can mark specific dates as blocked
- AC3: Changes to schedule do not affect already-confirmed bookings
- AC4: Slot grid in dashboard reflects schedule changes within 1 minute of saving
- AC5: System prevents overlapping time blocks

---

### 5.2 Consultation Flow

---

**US-D03: Doctor views AI pre-consult summary**

*As a doctor, I want to see a structured AI summary of the patient's history and current complaint before the consultation starts so that I can prepare without reading through old chats.*

**Acceptance Criteria:**
- AC1: Summary is auto-generated after patient completes booking (not on-demand)
- AC2: Summary is ≤200 words
- AC3: Every sentence in the summary is traceable to a source (shown in source footer)
- AC4: Doctor can edit the summary; edited version is saved but original is preserved in audit log
- AC5: If insufficient data exists, system shows: "Not enough history to generate a summary. Patient's intake form is available below."
- AC6: Summary generation does not block dashboard load; it loads async with a skeleton state

---

**US-D04: Doctor writes and sends a digital prescription**

*As a doctor, I want to write a prescription digitally and send it to the patient via WhatsApp so that neither of us needs a paper copy.*

**Acceptance Criteria:**
- AC1: Prescription is auto-populated with doctor registration details and patient details
- AC2: Drug name field has autocomplete from a standard formulary (at minimum: WHO essential medicines list + common Indian drugs)
- AC3: Prescription PDF is generated with a unique CURO URL for verification
- AC4: WhatsApp send triggers a delivery to the patient's registered number within 30 seconds
- AC5: Prescription is saved to patient's health thread immediately on save, regardless of WhatsApp delivery status
- AC6: Doctor cannot edit a prescription after it has been sent (can only add a new "amended" prescription)

---

### 5.3 Patient Booking

---

**US-P01: Patient books a consultation without calling the clinic**

*As a patient, I want to book a consultation, describe my symptoms, upload reports, and pay — all without a phone call.*

**Acceptance Criteria:**
- AC1: Entire booking flow completes in under 4 minutes on a 4G connection
- AC2: Patient receives WhatsApp confirmation within 60 seconds of payment
- AC3: Slot is soft-reserved during payment and released if payment times out (10 min)
- AC4: If payment fails, slot is released and patient is shown a retry option
- AC5: Patient does not need to create a password — OTP only
- AC6: Booking confirmation page is accessible via a unique URL for 30 days post-appointment

---

**US-P02: Returning patient books without re-entering personal details**

*As a returning patient, I want my details pre-filled so I only need to describe my current symptoms.*

**Acceptance Criteria:**
- AC1: Mobile OTP identifies returning patient
- AC2: Name, age, gender are pre-filled and editable
- AC3: Previous consultation history (with this doctor) is shown as context in a collapsible section
- AC4: Patient can upload new documents or reference previously uploaded ones

---

**US-P03: Patient views and shares their health records**

*As a patient, I want to view all my past prescriptions and reports in one place and share them with a new doctor.*

**Acceptance Criteria:**
- AC1: All prescriptions across all CURO doctors are visible in chronological order
- AC2: Each prescription is downloadable as a PDF
- AC3: Share link is time-limited (7 days), single-use, and revocable
- AC4: Shared link recipient sees a read-only view — no download without explicit patient permission
- AC5: Patient receives a notification when their shared link is accessed

---

### 5.4 Payment

---

**US-P04: Patient receives auto-confirmed payment without screenshot**

*As a patient, I want payment to be auto-confirmed so I never have to send a payment screenshot.*

**Acceptance Criteria:**
- AC1: Booking status moves to `Confirmed` automatically on Razorpay webhook `payment.captured`
- AC2: If webhook is delayed >60s, system polls Razorpay payment status as fallback
- AC3: Doctor is notified of confirmed payment via push/WhatsApp
- AC4: Failed payment shows descriptive reason and retry CTA
- AC5: Duplicate payment webhook events are idempotently handled (no double-confirmation)

---

## 6. Business Rules & Validations

### 6.1 Booking Rules

| Rule ID | Rule Description |
|---------|-----------------|
| BR-01 | A patient cannot book more than 1 appointment per day with the same doctor |
| BR-02 | A patient cannot book an appointment less than 30 minutes in the future (configurable per doctor) |
| BR-03 | A slot cannot be booked if the doctor has reached their daily patient cap |
| BR-04 | A slot hold during payment expires after 10 minutes; the slot returns to available |
| BR-05 | Cancellation by patient: full refund if >2 hours before slot; 50% refund if <2 hours; no refund for no-show |
| BR-06 | Cancellation by doctor: 100% refund, doctor receives cancellation count in admin analytics |
| BR-07 | Doctor must complete payment setup before booking link is active |
| BR-08 | Unverified doctors cannot accept payments (can accept bookings with "pay at clinic" for in-person) |

### 6.2 Prescription Rules

| Rule ID | Rule Description |
|---------|-----------------|
| BR-09 | A prescription can only be written by a verified doctor |
| BR-10 | A prescription can only be created within an active consultation (`In progress` or `Completed` status) |
| BR-11 | A prescription, once sent to patient, cannot be deleted — only superseded by an amended version |
| BR-12 | Prescription serial numbers are sequential per doctor and cannot be manually edited |
| BR-13 | Controlled substances (Schedule H, Schedule X) must be flagged with a warning in drug autocomplete |

### 6.3 Record Sharing Rules

| Rule ID | Rule Description |
|---------|-----------------|
| BR-14 | A patient can only share their own records (not another patient's) |
| BR-15 | Shared links expire in 7 days or on first access (whichever comes first) by default |
| BR-16 | Patient can revoke a shared link at any time before it's accessed |
| BR-17 | Doctor accessing a shared link must be a verified CURO user |

### 6.4 Data Validation Rules

| Field | Validation |
|-------|-----------|
| Mobile number | 10-digit Indian mobile (starts with 6–9); international: E.164 format |
| Email | RFC 5322 compliant; MX record check on registration |
| Age | Integer, 1–120 |
| Consultation fee | Decimal, ₹50–₹50,000, max 2 decimal places |
| Prescription drug name | Max 200 chars; alphanumeric + basic punctuation |
| File upload | Types: PDF, JPEG, PNG, HEIC; Max 10MB per file; 5 files per booking |
| Doctor slug | 3–40 chars; lowercase alphanumeric + hyphens; no consecutive hyphens; no reserved words |
| UPI ID | Regex: `[a-zA-Z0-9._-]+@[a-zA-Z0-9]+` |

---

## 7. Edge Cases & Error Handling

### 7.1 Payment Edge Cases

| Scenario | System Behaviour |
|----------|-----------------|
| Razorpay webhook delivery fails | Retry with exponential backoff (5 attempts over 30 min); fallback to polling Razorpay API after 3 failures |
| Patient pays but booking confirmation fails (DB write error) | Payment is captured; system flags for manual review; patient gets "We're confirming your booking" message; support notified |
| Double payment (user presses back and pays again) | Second payment auto-refunded via Razorpay; idempotency key prevents double-booking |
| Bank/UPI timeout (payment pending state) | Slot held for 15 min; if no capture within 15 min, refund initiated and slot released |
| Refund fails (patient bank account closed) | Flagged for manual resolution; admin notified; patient contacted via registered mobile |

### 7.2 Booking Edge Cases

| Scenario | System Behaviour |
|----------|-----------------|
| Two patients try to book the same slot simultaneously | Pessimistic lock during payment initiation; second patient shown "slot just taken, please choose another" |
| Doctor cancels after patient has already joined video call | Patient sees "Your doctor has cancelled this consultation. A full refund has been initiated." |
| Patient uploads a corrupted file | Virus/integrity scan catches it; patient shown "File could not be processed. Please try again." |
| Patient books and doctor's account is suspended before consultation | Booking auto-cancelled, full refund, patient notified, admin flagged |
| Network drops during prescription save | Autosave to localStorage + retry queue; on reconnect, server reconciles with latest draft |

### 7.3 AI Summary Edge Cases

| Scenario | System Behaviour |
|----------|-----------------|
| AI service unavailable | Dashboard shows "AI summary temporarily unavailable. Patient's intake form is shown below." |
| First-time patient (no history) | Summary shows only intake data with note: "First visit — no previous history available." |
| Patient intake form submitted with minimal data | Summary generated from available data; missing fields noted |
| AI returns hallucinated drug name in summary | Source attribution system prevents this — summary only synthesises from structured intake + past consultation records (not free generation) |

### 7.4 Error Response Standards

All API errors follow this envelope:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_ALREADY_TAKEN",
    "message": "This slot was just booked by another patient. Please select a different time.",
    "details": {},
    "request_id": "req_01HX..."
  }
}
```

Standard error codes:

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHENTICATED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Authenticated but lacks permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `SLOT_ALREADY_TAKEN` | 409 | Race condition on slot booking |
| `PAYMENT_FAILED` | 402 | Razorpay payment capture failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_UNAVAILABLE` | 503 | AI service down (non-blocking) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 8. API Specifications

### 8.1 Base URL & Versioning

```
Production:  https://api.curo.app/v1
Staging:     https://api-staging.curo.app/v1
```

All endpoints versioned via URL path. Breaking changes increment the version.

### 8.2 Authentication

```
Authorization: Bearer <jwt_access_token>
X-Refresh-Token: <refresh_token>       (on token refresh endpoint only)
X-Request-ID: <uuid>                   (client-generated, for tracing)
```

### 8.3 Endpoint Reference

---

#### Auth

```
POST   /auth/otp/send              Send OTP to mobile
POST   /auth/otp/verify            Verify OTP, returns access + refresh tokens
POST   /auth/token/refresh         Refresh access token
POST   /auth/logout                Invalidate refresh token
```

**POST /auth/otp/send**
```json
Request:  { "mobile": "9876543210", "purpose": "login|register" }
Response: { "success": true, "expires_in": 300, "masked_mobile": "98****3210" }
```

**POST /auth/otp/verify**
```json
Request:  { "mobile": "9876543210", "otp": "482910", "device_id": "..." }
Response: {
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 900,
  "user": { "id": "usr_...", "role": "PATIENT|DOCTOR", "setup_complete": true }
}
```

---

#### Doctor

```
POST   /doctors/register           Create doctor account
GET    /doctors/:id                Get doctor profile (public fields only if no auth)
PUT    /doctors/:id                Update doctor profile
GET    /doctors/:id/slots          Get available slots (public)
POST   /doctors/:id/schedule       Set/update weekly schedule
POST   /doctors/:id/blocked-dates  Block dates
GET    /doctors/:id/dashboard      Get dashboard data
GET    /doctors/:id/appointments   List appointments (paginated)
GET    /doctors/:id/patients       List unique patients
GET    /doctors/:id/analytics      Revenue, appointment, complaint analytics
```

**GET /doctors/:id/dashboard**
```json
Response: {
  "today": {
    "date": "2026-06-09",
    "appointments_count": 4,
    "collected_amount": 2000,
    "pending_payment_count": 1,
    "next_appointment": { ...appointment_object }
  },
  "slots": [
    { "time": "09:00", "status": "taken", "appointment_id": "apt_..." },
    { "time": "09:30", "status": "available" },
    { "time": "10:30", "status": "next", "appointment_id": "apt_..." }
  ]
}
```

---

#### Appointments

```
POST   /appointments               Create appointment (patient books)
GET    /appointments/:id           Get appointment details
PUT    /appointments/:id/status    Update status (doctor/system)
POST   /appointments/:id/cancel    Cancel with reason
GET    /appointments/:id/summary   Get AI pre-consult summary
POST   /appointments/:id/summary/regenerate  Regenerate AI summary
PUT    /appointments/:id/summary   Save doctor's edited summary
POST   /appointments/:id/notes     Save consult notes (autosave)
POST   /appointments/:id/start     Mark as In Progress + create video room
POST   /appointments/:id/complete  Mark as Completed
```

**POST /appointments**
```json
Request: {
  "doctor_id": "doc_...",
  "consultation_type": "online|in_person",
  "slot_date": "2026-06-09",
  "slot_time": "10:30",
  "chief_complaint": "Recurring fever since 3 days",
  "description": "...",
  "duration_value": 3,
  "duration_unit": "days",
  "document_ids": ["doc_..."]
}
Response: {
  "appointment_id": "apt_...",
  "status": "payment_pending",
  "slot_held_until": "2026-06-09T04:20:00Z",
  "payment_order": { "razorpay_order_id": "order_...", "amount": 50000, "currency": "INR" }
}
```

---

#### Prescriptions

```
POST   /prescriptions              Create prescription (doctor only)
GET    /prescriptions/:id          Get prescription
GET    /prescriptions/:id/pdf      Download prescription PDF
POST   /prescriptions/:id/send-whatsapp  Send via WhatsApp
POST   /prescriptions/:id/amend    Create amended version
GET    /patients/:id/prescriptions List patient's prescriptions
```

**POST /prescriptions**
```json
Request: {
  "appointment_id": "apt_...",
  "diagnosis": "Viral fever — acute",
  "medications": [
    {
      "drug_name": "Paracetamol 500mg",
      "dose": "1 tablet",
      "frequency": "1-0-1",
      "duration": "5 days",
      "instructions": "After food"
    }
  ],
  "investigations": "",
  "advice": "Rest, fluids. Review if fever persists beyond 5 days.",
  "followup_date": "2026-06-14"
}
Response: {
  "prescription_id": "rx_...",
  "serial_number": "RX-SHARMA-0142",
  "pdf_url": "https://cdn.curo.app/rx/rx_...signed_url",
  "verify_url": "https://curo.app/rx/rx_..."
}
```

---

#### Patients

```
GET    /patients/:id               Get patient profile
PUT    /patients/:id               Update patient profile
GET    /patients/:id/records       Full health thread
GET    /patients/:id/appointments  Appointment history
GET    /patients/:id/documents     Uploaded documents
POST   /patients/:id/share-link    Generate record share link
DELETE /patients/:id/share-link/:token  Revoke share link
GET    /share/:token               Access shared records (public, token-auth)
```

---

#### Payments

```
POST   /payments/order             Create Razorpay order
POST   /payments/verify            Verify payment signature (client-side)
POST   /payments/webhook           Razorpay webhook endpoint (HMAC-verified)
POST   /payments/:id/refund        Initiate refund
GET    /payments/:id               Get payment details
GET    /doctors/:id/payouts        List payout history
```

---

#### Documents

```
POST   /documents/upload-url       Get presigned S3 upload URL
POST   /documents/confirm          Confirm upload completion + trigger virus scan
GET    /documents/:id              Get document metadata
GET    /documents/:id/download     Get signed download URL
DELETE /documents/:id              Soft-delete document
```

---

#### Notifications

```
GET    /notifications              List user notifications
PUT    /notifications/:id/read     Mark as read
POST   /notifications/preferences  Update notification preferences
```

---

#### Admin

```
GET    /admin/doctors              List all doctors (with filters)
PUT    /admin/doctors/:id/verify   Approve/reject doctor verification
GET    /admin/appointments         All appointments (with filters)
POST   /admin/refunds/:id/approve  Approve disputed refund
GET    /admin/analytics            Platform-wide metrics
PUT    /admin/doctors/:id/suspend  Suspend doctor account
```

---

### 8.4 Pagination Standard

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 143,
    "total_pages": 8,
    "next_cursor": "cur_eyJ..."
  }
}
```

Cursor-based pagination used for high-frequency endpoints (appointments, notifications).

---

## 9. Database Schema

### 9.1 Technology

- **Primary database:** PostgreSQL 16 (managed — AWS RDS or Supabase)
- **Cache:** Redis 7 (session store, slot locks, rate limiting)
- **Object storage:** AWS S3 (documents, prescription PDFs, profile photos)
- **Full-text search:** PostgreSQL `tsvector` (Elasticsearch if scale demands it)

### 9.2 Core Tables

---

```sql
-- ============================================================
-- USERS (auth identity layer)
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile          VARCHAR(15) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE,
  role            user_role NOT NULL,   -- enum: SUPER_ADMIN, ADMIN, DOCTOR, CLINIC_STAFF, PATIENT
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ          -- soft delete
);

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','ADMIN','DOCTOR','CLINIC_STAFF','PATIENT');

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE doctors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id),
  slug                  VARCHAR(40) UNIQUE NOT NULL,
  full_name             VARCHAR(255) NOT NULL,
  profile_photo_url     TEXT,
  qualifications        TEXT[],
  specialisations       TEXT[],
  registration_number   VARCHAR(50) NOT NULL,
  registration_council  VARCHAR(100) NOT NULL,
  clinic_name           VARCHAR(255),
  city                  VARCHAR(100),
  bio                   VARCHAR(500),
  languages             TEXT[],
  verification_status   doctor_verification_status DEFAULT 'pending',
  verified_at           TIMESTAMPTZ,
  verified_by           UUID REFERENCES users(id),
  rejection_reason      TEXT,
  is_active             BOOLEAN DEFAULT true,
  booking_link_active   BOOLEAN DEFAULT false,
  average_rating        DECIMAL(3,2) DEFAULT 0,
  review_count          INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE doctor_verification_status AS ENUM ('pending','verified','rejected','suspended');

-- ============================================================
-- CONSULTATION TYPES
-- ============================================================
CREATE TABLE consultation_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id         UUID NOT NULL REFERENCES doctors(id),
  type              consult_type NOT NULL,   -- online | in_person | follow_up
  fee               DECIMAL(10,2) NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 15,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE consult_type AS ENUM ('online','in_person','follow_up');

-- ============================================================
-- DOCTOR SCHEDULE
-- ============================================================
CREATE TABLE doctor_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id),
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctor_schedule_breaks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID NOT NULL REFERENCES doctor_schedules(id),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL
);

CREATE TABLE doctor_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id),
  blocked_date  DATE NOT NULL,
  reason        VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, blocked_date)
);

CREATE TABLE doctor_settings (
  doctor_id             UUID PRIMARY KEY REFERENCES doctors(id),
  buffer_minutes        INTEGER DEFAULT 5,
  max_patients_per_day  INTEGER DEFAULT 30,
  min_booking_advance_minutes INTEGER DEFAULT 30,
  cancellation_window_hours   INTEGER DEFAULT 2,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  full_name     VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  age           SMALLINT,
  gender        gender_type,
  blood_group   VARCHAR(5),
  allergies     TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE gender_type AS ENUM ('male','female','other','prefer_not_to_say');

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id               UUID NOT NULL REFERENCES doctors(id),
  patient_id              UUID NOT NULL REFERENCES patients(id),
  consultation_type_id    UUID NOT NULL REFERENCES consultation_types(id),
  slot_date               DATE NOT NULL,
  slot_time               TIME NOT NULL,
  slot_held_until         TIMESTAMPTZ,
  status                  appointment_status DEFAULT 'payment_pending',
  chief_complaint         TEXT NOT NULL,
  complaint_description   TEXT,
  duration_value          SMALLINT,
  duration_unit           VARCHAR(10),
  consultation_started_at TIMESTAMPTZ,
  consultation_ended_at   TIMESTAMPTZ,
  consult_notes           TEXT,
  consult_notes_updated_at TIMESTAMPTZ,
  ai_summary              TEXT,
  ai_summary_edited       TEXT,
  ai_summary_sources      JSONB,
  cancellation_reason     TEXT,
  cancelled_by            UUID REFERENCES users(id),
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, slot_date, slot_time)
);

CREATE TYPE appointment_status AS ENUM (
  'payment_pending','confirmed','in_progress','completed','cancelled','no_show'
);

CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, slot_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  appointment_id  UUID REFERENCES appointments(id),
  original_name   VARCHAR(255) NOT NULL,
  storage_key     TEXT NOT NULL,        -- S3 object key
  mime_type       VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  virus_scan_status VARCHAR(20) DEFAULT 'pending',  -- pending|clean|infected
  is_deleted      BOOLEAN DEFAULT false,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================
CREATE TABLE prescriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id),
  doctor_id         UUID NOT NULL REFERENCES doctors(id),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  serial_number     VARCHAR(50) NOT NULL,
  diagnosis         TEXT NOT NULL,
  investigations    TEXT,
  advice            TEXT,
  followup_date     DATE,
  pdf_storage_key   TEXT,
  verify_token      VARCHAR(32) UNIQUE NOT NULL,
  is_amended        BOOLEAN DEFAULT false,
  amended_by_rx_id  UUID REFERENCES prescriptions(id),
  sent_via_whatsapp BOOLEAN DEFAULT false,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, serial_number)
);

CREATE TABLE prescription_medications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id   UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_name         VARCHAR(200) NOT NULL,
  dose              VARCHAR(100),
  frequency         VARCHAR(50),
  duration          VARCHAR(100),
  instructions      TEXT,
  sort_order        SMALLINT DEFAULT 0
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id          UUID NOT NULL REFERENCES appointments(id),
  razorpay_order_id       VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id     VARCHAR(100) UNIQUE,
  amount                  INTEGER NOT NULL,  -- in paise
  currency                VARCHAR(3) DEFAULT 'INR',
  status                  payment_status DEFAULT 'created',
  platform_fee            INTEGER,           -- in paise
  doctor_payout_amount    INTEGER,           -- in paise
  refund_id               VARCHAR(100),
  refund_amount           INTEGER,
  refund_reason           TEXT,
  refunded_at             TIMESTAMPTZ,
  metadata                JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE payment_status AS ENUM ('created','authorized','captured','failed','refunded','partially_refunded');

-- ============================================================
-- PAYOUTS
-- ============================================================
CREATE TABLE payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id           UUID NOT NULL REFERENCES doctors(id),
  razorpay_payout_id  VARCHAR(100),
  amount              INTEGER NOT NULL,  -- in paise
  status              VARCHAR(30),
  settlement_date     DATE,
  payment_ids         UUID[],
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SHARE LINKS
-- ============================================================
CREATE TABLE record_share_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  token         VARCHAR(64) UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  accessed_at   TIMESTAMPTZ,
  accessed_by   UUID REFERENCES users(id),
  is_revoked    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255),
  body        TEXT,
  data        JSONB,
  channel     notification_channel,
  is_read     BOOLEAN DEFAULT false,
  sent_at     TIMESTAMPTZ,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE notification_channel AS ENUM ('push','whatsapp','email','sms','in_app');

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  request_id    VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- VIDEO SESSIONS
-- ============================================================
CREATE TABLE video_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id),
  provider          VARCHAR(30) NOT NULL,  -- daily.co | twilio | 100ms
  room_name         VARCHAR(255) NOT NULL,
  room_url          TEXT NOT NULL,
  doctor_token      TEXT,
  patient_token     TEXT,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.3 Indexes & Performance Notes

- Partition `appointments` by `slot_date` (monthly partitions) at scale
- Partition `audit_logs` by `created_at` (quarterly)
- Use `pg_trgm` index on `patients.full_name` for search
- Materialised view for doctor dashboard stats (refresh every 5 minutes)
- Read replicas for analytics queries (never run analytics on primary)

---

## 10. Notification System

### 10.1 Channels

| Channel | Provider | Use Case |
|---------|----------|----------|
| WhatsApp Business | Gupshup / Meta WABA | Primary patient communication |
| Email | AWS SES | Confirmation documents, receipts |
| In-app push | Firebase FCM | Doctor real-time alerts |
| SMS | Twilio / MSG91 | OTP, fallback for WhatsApp failures |

### 10.2 Notification Event Matrix

| Event | Patient | Doctor | Channel |
|-------|---------|--------|---------|
| Booking confirmed | ✓ Confirmation + details | ✓ New booking alert | WA + Email |
| Payment received | ✓ Receipt | ✓ Payment received | WA |
| 24h reminder | ✓ Reminder | — | WA |
| 30min reminder | ✓ Reminder + join link | ✓ Next patient brief | WA |
| Consultation started | — | — | — |
| Prescription sent | ✓ Rx attached | — | WA |
| Booking cancelled by doctor | ✓ Cancellation + refund info | — | WA + Email |
| Booking cancelled by patient | — | ✓ Cancellation notice | WA |
| Refund processed | ✓ Refund confirmation | — | WA |
| Share link accessed | ✓ Alert | — | In-app |
| OTP | ✓ OTP | ✓ OTP | SMS |

### 10.3 WhatsApp Template Messages

WhatsApp Business API requires pre-approved templates for outbound messages:

```
TEMPLATE: booking_confirmation
Body: "Hi {{1}}, your consultation with Dr. {{2}} is confirmed for {{3}} at {{4}}.
      Booking ID: {{5}}
      For online consult, your link: {{6}}
      Reply CANCEL to cancel (free until 2 hours before)."

TEMPLATE: prescription_delivery
Body: "Hi {{1}}, Dr. {{2}} has sent your prescription dated {{3}}.
      Download: {{4}}
      Verify at: {{5}}"

TEMPLATE: appointment_reminder_30min
Body: "Your consultation with Dr. {{1}} starts in 30 minutes.
      {{2}}"   (conditional: join link for online / clinic address for in-person)
```

### 10.4 Notification Preferences

Patients can opt out of marketing communications but not transactional (booking, payment, prescription).

---

## 11. Video Consultation

### 11.1 Provider Recommendation

**Primary:** Daily.co (WebRTC, HIPAA-eligible plan)  
**Fallback:** 100ms.live

Selection criteria: Daily.co offers per-minute billing, HIPAA BAA availability, no SDK installation required (URL-based join), and recording capability for future use.

### 11.2 Room Management

- Video room created when doctor clicks "Start consult" (`POST /appointments/:id/start`)
- Room is appointment-specific, single-use
- Room expires 2 hours after creation
- Unique JWT tokens generated for doctor and patient (different permissions)
- Doctor token: camera + mic + screen share + recording control
- Patient token: camera + mic only

### 11.3 Join Flow

- Doctor: joins from CURO dashboard "Start consult" button → opens in-app WebRTC view or new tab
- Patient: receives join link in WhatsApp 30 min before appointment → opens in browser (no app install required)
- Both participants see waiting room if the other hasn't joined
- System records join/leave timestamps

### 11.4 Connection Handling

- If patient doesn't join within 15 minutes of appointment time: doctor notified, appointment can be marked "No-show"
- If connection drops: automatic reconnect attempt for 60 seconds; UI shows "Reconnecting..."
- If reconnect fails: patient shown dial-in number fallback (Twilio voice) and doctor shown patient's mobile number

### 11.5 Future: Recording

- Not in MVP
- Infrastructure: Daily.co cloud recording → S3 storage → patient consent required → 90-day retention
- Legal requirement: both parties must consent; consent captured via in-app prompt before recording starts

---

## 12. Payment & Billing

### 12.1 Payment Provider

**Razorpay** — primary processor  
- Route: Razorpay Route for split payments (doctor + platform)
- Escrow: payments held by Razorpay, settled to doctor T+2
- International: not supported in MVP

### 12.2 Fee Structure

```
Patient pays: Consultation Fee + Convenience Fee (₹10 flat or 2%, whichever is higher)
Platform earns: Convenience Fee + 2.5% of Consultation Fee (min ₹10)
Doctor receives: Consultation Fee - 2.5% (settled via Razorpay Route)
```

### 12.3 Payment Flow

```
1. POST /payments/order
   → Create Razorpay order (server-side)
   → Soft-reserve slot in Redis with TTL 10 min

2. Razorpay Checkout (client-side)
   → Patient completes payment in Razorpay SDK
   → Razorpay returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }

3. POST /payments/verify
   → Server verifies HMAC signature
   → If valid: update payment status → authorized

4. Razorpay Webhook: payment.captured
   → Server receives webhook (HMAC-verified)
   → Update payment → captured
   → Update appointment → confirmed
   → Release slot lock
   → Trigger booking_confirmation notifications

5. T+2: Razorpay Route settles to doctor's linked account
```

### 12.4 Refund Logic

```
Cancellation > 2h before slot:   100% refund
Cancellation < 2h before slot:   50% refund (doctor retains 50%)
No-show (patient):               0% refund
No-show (doctor):                100% refund + ₹50 goodwill credit to patient
Doctor cancels:                  100% refund + ₹50 goodwill credit to patient
```

Refunds initiated via Razorpay API; reflect in patient's account in 5–7 business days.

### 12.5 Invoicing & Taxation

- Platform generates GST invoice for its service fee
- Doctor responsible for their own GST registration if applicable
- Annual doctor billing summary available for download (for ITR)

---

## 13. Admin Panel

### 13.1 Access

- Separate subdomain: `admin.curo.app`
- Login: email + password + TOTP (2FA mandatory for ADMIN and SUPER_ADMIN)
- Session timeout: 4 hours of inactivity

### 13.2 Doctor Management

- List all doctors with filters: verification status, city, specialisation, registration date
- Doctor detail view: profile, appointments count, revenue, complaints, documents
- Verify / reject with reason
- Suspend / reactivate with reason + audit trail
- View doctor's patients (read-only)

### 13.3 Appointment Management

- All appointments across platform (filterable)
- Manual status override (for disputes)
- View consultation notes and prescriptions
- Initiate refunds on behalf of platform

### 13.4 Financial Reconciliation

- Platform fee collection summary (daily/weekly/monthly)
- Payout status per doctor
- Failed payout queue
- Manual refund approval queue

### 13.5 Analytics Dashboard

- Daily/weekly/monthly active doctors
- Bookings per day (trend)
- Conversion rate (booking page visits → confirmed bookings)
- Revenue by specialisation, city
- Average consultation duration
- Refund rate
- Doctor verification funnel

### 13.6 Content Management

- Drug formulary management (add/edit/deactivate drugs in autocomplete)
- Notification template management (WhatsApp template status)
- Platform announcement banners
- Blocked mobile numbers (fraud)

---

## 14. Analytics & Tracking Events

### 14.1 Frontend Events (client-side, sent to Mixpanel / PostHog)

```
doctor_signup_started
doctor_signup_step_completed        { step: 1|2|3|4 }
doctor_setup_completed
booking_page_viewed                 { doctor_id, source }
booking_step_started                { step: 1|2|3|4 }
booking_step_completed              { step: 1|2|3|4 }
booking_payment_initiated           { amount, consultation_type }
booking_payment_completed           { amount, method }
booking_payment_failed              { reason }
booking_confirmed
consultation_started                { doctor_id }
prescription_written
prescription_sent_whatsapp
patient_records_viewed
share_link_generated
share_link_accessed
```

### 14.2 Backend Events (sent to internal analytics pipeline)

```
otp_sent                { purpose, channel }
otp_verified            { success: bool }
slot_reserved
slot_released           { reason: payment_timeout|booking_cancelled|completed }
ai_summary_generated    { appointment_id, generation_time_ms }
ai_summary_edited
webhook_received        { provider, event }
payment_captured
refund_initiated
doctor_verified
doctor_suspended
```

### 14.3 Funnel Monitoring

Critical funnels to monitor in real-time:

1. **Booking funnel:** page view → step 1 → step 2 → step 3 → step 4 → confirmed
2. **Doctor setup funnel:** registration → step 1 → step 2 → step 3 → step 4 → first booking
3. **Payment funnel:** order created → checkout opened → payment attempted → captured

Alert if booking confirmation rate drops below 35% in any 1-hour window.

---

## 15. Security Requirements

### 15.1 Authentication & Session Management

- **JWT Access Token:** HS256, 15-minute expiry, payload: `{ user_id, role, session_id }`
- **Refresh Token:** Opaque 256-bit token, 30-day expiry, stored in Redis with user binding
- **Token rotation:** Refresh token rotated on each use; old token immediately invalidated
- **OTP:** 6-digit numeric, HMAC-SHA256 based (not random), 5-minute expiry, max 3 attempts before 15-minute lockout
- **Patient auth:** OTP-only (no password); mobile is primary identifier
- **Doctor auth:** OTP + optional password; TOTP (Google Authenticator) available as 2FA
- **Admin auth:** Email + password + mandatory TOTP; no OTP login

### 15.2 Role-Based Access Control

```
Middleware stack:
1. authenticate()       — verifies JWT, loads user from Redis session cache
2. authorize(roles[])   — checks role against allowed roles list
3. ownership()          — verifies resource belongs to requesting user (e.g., doctor can only access own appointments)
```

Every API endpoint explicitly declares its `roles[]` and `ownership` requirements. No endpoint is public by default; explicitly marked routes bypass auth.

### 15.3 Encryption

**In Transit:**
- TLS 1.3 minimum on all endpoints
- HSTS with `max-age=63072000; includeSubDomains; preload`
- Certificate pinning in mobile apps

**At Rest:**
- RDS: AES-256 encryption at rest (AWS managed keys)
- S3: Server-side encryption (SSE-S3 or SSE-KMS for medical documents)
- Redis: Encrypted at rest (ElastiCache with encryption enabled)
- PII fields additionally encrypted at application layer using `pgcrypto`:
  - `patients.date_of_birth`
  - `users.mobile`
  - `users.email`
  - `prescription_medications` (full table)
  - `appointments.consult_notes`

**Key Management:**
- AWS KMS for envelope encryption
- Separate KMS keys for: user PII, medical records, prescription PDFs
- Key rotation: annually (automated)

### 15.4 Audit Logging

- All write operations on sensitive entities (patients, appointments, prescriptions, payments, user accounts) generate an audit log entry
- Log includes: `user_id`, `action`, `entity_type`, `entity_id`, `old_value` (sanitised), `new_value` (sanitised), `ip_address`, `user_agent`, `request_id`
- Audit logs are append-only; no API allows deletion
- Logs retained for 7 years (DPDP compliance)
- Admin actions additionally logged to immutable CloudWatch Logs stream

### 15.5 API Rate Limiting

Implemented via Redis token bucket algorithm:

```
OTP send:               3 requests / mobile / 15 minutes
OTP verify:             5 attempts / mobile / 15 minutes (then 15-min lockout)
Booking creation:       10 requests / user / hour
AI summary generation:  20 requests / doctor / hour
Document upload URL:    20 requests / user / hour
Payment order create:   10 requests / user / hour
General API:            300 requests / user / minute
Public endpoints:       60 requests / IP / minute
```

Rate limit headers returned on all responses:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 247
X-RateLimit-Reset: 1749470400
Retry-After: 30   (only on 429)
```

### 15.6 Input Validation & Sanitisation

- All input validated at API boundary using Zod (TypeScript) / Pydantic (Python)
- Strict schema validation: unknown fields rejected (no passthrough)
- String fields: max length enforced, HTML stripped (DOMPurify equivalent server-side)
- SQL: parameterised queries only via ORM (Prisma / SQLAlchemy); raw SQL forbidden except in explicitly reviewed migration files
- File uploads: MIME type validated from file content (not extension); magic bytes checked

### 15.7 XSS, CSRF & Injection Protection

**XSS:**
- CSP header: `default-src 'self'; script-src 'self' https://cdn.razorpay.com; frame-ancestors 'none'`
- All user-generated content HTML-escaped at render time
- Prescription PDF generated server-side (no client HTML rendering of user content)

**CSRF:**
- SameSite=Strict cookies for session
- Double-submit cookie pattern for state-changing requests
- Origin header validation on all non-GET requests

**SQL Injection:**
- ORM parameterised queries as primary defence
- Database user has minimum required permissions (no DROP, no schema changes)
- Separate read-only DB user for analytics queries

**Header Injection:**
- Strict validation of any user-supplied values used in HTTP headers

### 15.8 File Upload Security

```
Validation pipeline:
1. Presigned S3 URL issued with ContentType and ContentLength constraints
2. Upload goes directly to S3 (not through API server)
3. S3 event triggers Lambda → ClamAV virus scan
4. POST /documents/confirm called by client after upload
5. Server verifies: file exists in S3, MIME matches declared type, size within limit
6. Virus scan status checked; infected files deleted, patient notified
7. Only after all checks pass is document linked to appointment

Storage:
- All documents in private S3 bucket (no public access)
- Access via signed URLs (15-minute expiry)
- Prescription PDFs stored separately in read-access-controlled bucket
- No user-supplied filenames used as S3 keys (UUID-based keys only)
```

### 15.9 Webhook Security

- Razorpay webhooks: HMAC-SHA256 signature validated before processing
- Gupshup/WhatsApp webhooks: IP allowlist + token validation
- Webhook endpoints return 200 immediately, processing async (prevents replay timeout attacks)
- Idempotency: webhook event IDs stored in Redis (24h TTL); duplicate events silently acknowledged

### 15.10 Data Privacy (DPDP 2023 Compliance — India)

- Privacy policy and consent captured at registration (explicit checkbox, version-stamped)
- Data minimisation: only collect fields required for the feature
- Right to erasure: patient can request account deletion; PII anonymised, medical records retained 7 years per law
- Data localisation: all data stored in `ap-south-1` (Mumbai) region
- Data Processing Agreement (DPA) with all third-party processors

---

## 16. Technical Architecture

### 16.1 Technology Stack

```
Frontend (Patient + Doctor App):
  Framework:    Next.js 14 (App Router)
  Language:     TypeScript 5
  Styling:      Tailwind CSS + shadcn/ui
  State:        Zustand (client state) + React Query (server state)
  Forms:        React Hook Form + Zod
  Testing:      Vitest + Playwright (E2E)

Backend API:
  Runtime:      Node.js 20 (via Bun) OR Python 3.12 (FastAPI)
  Framework:    Fastify (Node) / FastAPI (Python)
  Language:     TypeScript / Python
  ORM:          Prisma (Node) / SQLAlchemy + Alembic (Python)
  Validation:   Zod / Pydantic
  Auth:         Custom JWT (jose library)

Admin Panel:
  Framework:    Next.js 14 (separate deployment)
  Auth:         NextAuth.js with TOTP

Infrastructure:
  Cloud:        AWS (primary)
  Container:    Docker + ECS Fargate
  DB:           RDS PostgreSQL 16 (Multi-AZ)
  Cache:        ElastiCache Redis 7
  Storage:      S3 (documents) + CloudFront (CDN)
  Queue:        SQS + Lambda (background jobs)
  Email:        AWS SES
  Monitoring:   Datadog
  Logging:      CloudWatch Logs
  Secrets:      AWS Secrets Manager
  IaC:          Terraform
```

### 16.2 Architecture Diagram (Logical)

```
┌────────────────────────────────────────────────────────┐
│                     Clients                            │
│  [Patient Browser]  [Doctor App (Next.js PWA)]  [Admin]│
└──────────────┬──────────────────┬──────────────────────┘
               │                  │
               ▼                  ▼
┌─────────────────────────────────────────────┐
│         AWS CloudFront (CDN + WAF)          │
│  WAF rules: rate limit, geo, OWASP Top 10   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│       API Gateway / Application Load Balancer│
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  API Service  │ │ AI Worker│ │ Notification │
│  (Fargate)    │ │(Fargate) │ │  Worker      │
│  x2-4 tasks   │ │ x1-2     │ │  (Fargate)   │
└──────┬───────┘ └────┬─────┘ └──────┬───────┘
       │              │               │
       ▼              ▼               ▼
┌──────────────────────────────────────────────┐
│              Data Layer                       │
│  [RDS PostgreSQL]  [ElastiCache Redis]  [S3] │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│           External Services                   │
│  Razorpay  │  Daily.co  │  Gupshup  │  SES  │
└──────────────────────────────────────────────┘
```

### 16.3 Frontend Architecture

```
app/
├── (public)/
│   └── [slug]/              ← Booking page (SSR, SEO-optimised)
│       ├── page.tsx
│       └── book/
│           ├── layout.tsx   ← Multi-step form shell
│           ├── page.tsx     ← Step 1: Patient details
│           ├── symptoms/    ← Step 2
│           ├── slot/        ← Step 3
│           └── payment/     ← Step 4
├── (auth)/
│   └── login/
├── (doctor)/
│   ├── dashboard/
│   ├── appointments/[id]/
│   ├── patients/
│   ├── prescriptions/
│   └── settings/
├── (patient)/
│   ├── records/
│   └── appointments/
└── share/[token]/           ← Public shared records view
```

**Key patterns:**
- Doctor dashboard: React Query with 30s polling for appointment status updates
- Prescription editor: optimistic updates + autosave debounce (3s)
- Booking steps: URL-based state (`/book?step=2`) for deep-linking and back-button support
- File uploads: direct-to-S3 with presigned URL; progress tracked in UI

### 16.4 Caching Strategy

```
Layer 1 — CDN (CloudFront):
  Doctor public profile page: cached 60s (stale-while-revalidate)
  Static assets: cached 1 year (content-hashed)

Layer 2 — Redis:
  Key                           TTL     Purpose
  session:{user_id}             30d     JWT session store
  otp:{mobile}                  5min    OTP value + attempt count
  slot_hold:{date}:{time}:{doc} 10min   Soft slot reservation
  doc_slots:{doc_id}:{date}     2min    Available slots for a doctor+date
  dashboard:{doc_id}            5min    Cached dashboard stats
  rate_limit:{key}              varies  Token bucket counters
  ai_summary:{appt_id}          24h     Generated AI summary

Layer 3 — DB Materialised Views:
  doctor_dashboard_stats        refresh every 5 min via pg_cron
```

### 16.5 Background Jobs & Queues

**SQS Queues:**

| Queue | Handler | Trigger |
|-------|---------|---------|
| `notifications` | NotificationWorker | Any notification event |
| `ai-summary` | AIWorker | Booking confirmed |
| `pdf-generation` | PDFWorker | Prescription saved |
| `virus-scan` | ScanWorker | Document uploaded to S3 |
| `payment-retry` | PaymentWorker | Webhook delivery failed |
| `slot-release` | SlotWorker | Payment timeout (SQS delay) |

**Scheduled Jobs (EventBridge + Lambda):**

| Job | Schedule | Action |
|-----|----------|--------|
| appointment_reminder_24h | Every hour | Find appointments in 24h window, send WA |
| appointment_reminder_30min | Every 10 min | Find appointments in 30min window, send WA + create video room |
| no_show_checker | Every 15 min | Mark appointments as no_show if past start time + 15min and not started |
| payout_reconciliation | Daily 11pm | Verify Razorpay payout statuses |
| slot_lock_cleanup | Every 5 min | Release expired slot holds not caught by SQS delay |
| analytics_rollup | Daily 1am | Aggregate daily metrics |

### 16.6 Monitoring & Alerting

**Metrics (Datadog):**
- API p50/p95/p99 latency per endpoint
- Error rate per endpoint
- Booking confirmation rate (bookings confirmed / orders created)
- Payment success rate
- AI summary generation success rate
- WhatsApp delivery rate

**Alerts (PagerDuty):**

| Alert | Threshold | Severity |
|-------|-----------|----------|
| API 5xx rate | >1% over 5 min | P1 |
| Payment success rate | <90% over 15 min | P1 |
| Booking confirmation rate | <35% over 1h | P2 |
| DB connection pool exhausted | >80% | P2 |
| Redis memory | >80% | P2 |
| AI summary failure rate | >20% over 30 min | P3 |
| WhatsApp delivery failure | >15% over 1h | P3 |

**Logging:**
- Structured JSON logs (Bunyan/structlog)
- Log levels: ERROR (PagerDuty), WARN (Slack #alerts), INFO (CloudWatch)
- Sensitive fields (mobile, email, OTP, payment details) redacted from logs via log filter
- Log retention: 90 days (INFO), 1 year (ERROR/WARN), 7 years (Audit)

### 16.7 Scalability Design

**Horizontal scaling targets:**

| Component | MVP (Day 1) | 6 months | 2 years |
|-----------|------------|---------|---------|
| API tasks | 2 | 4–8 | 20+ |
| DB connections | 100 | 200 | 500 (PgBouncer) |
| Redis nodes | 1 | 3-node cluster | Cluster mode |
| Appointments/day | 1,000 | 20,000 | 500,000 |

**Bottleneck mitigations:**
- Slot booking: Redis-based distributed lock prevents race conditions at scale
- PDF generation: offloaded to worker queue; never blocks API response
- AI summaries: async generation, results cached; never on critical path
- DB read replicas for dashboard and analytics from day 1

---

## 17. Non-Functional Requirements

### 17.1 Performance

| Metric | Target |
|--------|--------|
| API response time (p95) | < 300ms |
| Booking page load (LCP) | < 2.5s on 4G |
| Dashboard load (first paint) | < 1.5s |
| PDF generation time | < 5s |
| AI summary generation | < 8s (async, non-blocking) |
| WhatsApp notification delivery | < 60s of trigger event |
| Slot reservation lock acquisition | < 50ms |

### 17.2 Availability & Reliability

| Metric | Target |
|--------|--------|
| API uptime | 99.9% (< 8.7h downtime/year) |
| Booking flow uptime | 99.95% |
| Payment processing uptime | 99.99% (Razorpay SLA + own failover) |
| Planned maintenance window | Sundays 2–4 AM IST |
| RTO (Recovery Time Objective) | 30 minutes |
| RPO (Recovery Point Objective) | 5 minutes |

### 17.3 Compliance

- **DPDP Act 2023 (India):** Data localisation, consent management, right to erasure
- **IT Act 2000:** Electronic records and signatures for prescriptions
- **PCIDSS:** Not storing card data (Razorpay handles); SAQ-A compliance
- **Telemedicine Practice Guidelines (MoHFW 2020):** Consultations by registered practitioners only; prescription norms followed

### 17.4 Accessibility

- WCAG 2.1 Level AA for all patient-facing pages
- Minimum 44px touch targets on mobile
- All images have alt text
- Forms are screen-reader compatible

### 17.5 Browser & Device Support

- **Mobile browsers:** Chrome Android 90+, Safari iOS 14+
- **Desktop browsers:** Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Minimum screen width:** 320px (patient flow), 768px (doctor dashboard)
- **PWA:** Service worker for offline prescription drafting

---

## 18. MVP Scope & Future Enhancements

### 18.1 MVP (Month 1–3)

In scope:
- Doctor onboarding (4-step setup)
- Patient booking flow (4 steps, online consultations only in MVP)
- OTP-based auth (patients + doctors)
- Appointment management (create, confirm, complete, cancel)
- AI pre-consult summary
- Digital prescription (create, PDF, WhatsApp send)
- Razorpay payment integration (UPI + card)
- WhatsApp notifications (booking confirmation, prescription, reminders)
- Patient health records view (prescriptions + uploaded documents)
- Basic doctor dashboard (today view)
- Doctor verification (manual admin review)
- Admin panel (basic: verify doctors, view appointments, manual refunds)

Out of scope for MVP:
- Video consultation (Phase 2)
- In-person booking (Phase 2)
- Follow-up consultation type (Phase 2)
- Patient reviews and ratings (Phase 2)
- Clinic staff sub-accounts (Phase 3)
- Record sharing (Phase 2)
- Mobile app (React Native) (Phase 3)
- Analytics dashboard for doctors (Phase 2)
- Drug formulary autocomplete (simplified: freetext in MVP) (Phase 2)

### 18.2 Phase 2 (Month 4–6)

- Video consultation (Daily.co integration)
- In-person booking with clinic address
- Patient record sharing (time-limited links)
- Doctor analytics dashboard
- Rating and review system
- Follow-up consultation type with discount
- Clinic staff accounts
- Drug formulary autocomplete (top 500 drugs)
- Cancellation self-service (patient-initiated)
- Mobile-optimised PWA (offline prescription draft)

### 18.3 Phase 3 (Month 7–12)

- React Native mobile apps (iOS + Android)
- Multi-doctor clinic accounts
- ABDM (Ayushman Bharat Digital Mission) integration (ABHA ID linking)
- Lab report ordering integration (Thyrocare / Redcliffe via API)
- Telemedicine marketplace (opt-in discovery for doctors)
- Patient-facing AI symptom pre-checker (before booking)
- Longitudinal health trends (weight, BP tracking across visits)
- WhatsApp bot booking flow (book without visiting website)
- Payout acceleration (T+0 for premium doctors)
- Doctor referral programme

### 18.4 Phase 4 (Year 2+)

- Multi-country expansion (UAE market — with UX already partially designed for UAE)
- EMR-lite features (ICD-10 coding, SOAP notes)
- Insurance claims integration
- AI-assisted diagnosis support (evidence-based suggestions, not prescriptive)
- API for third-party EHR integration
- White-label product for clinic chains

---

*End of CURO PRD v1.0.0*

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | June 2026 | Product Team | Initial release |

**Review Required From:** Engineering Lead, Security, Legal (DPDP compliance), Razorpay Integration Team
