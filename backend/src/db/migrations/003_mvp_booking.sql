-- Migration 003: MVP Booking — appointment lifecycle, UPI payment, prescription PDF
-- Run via: npm run db:migrate

-- ─── Appointments: add Cal booking ID + Meet link columns ─────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS meet_link TEXT,
  ADD COLUMN IF NOT EXISTS cal_booking_id VARCHAR(100);

-- ─── Prescriptions: add PDF URL column ────────────────────────────────────────
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- ─── Doctors: UPI payment info ────────────────────────────────────────────────
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS upi_qr_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0;

-- Note: onboarding_step may already exist, wrapped in IF NOT EXISTS
-- If it fails because the column already exists, that's fine.

-- ─── Patients: ensure date_of_birth exists (already in base schema) ────────────
-- The base schema has date_of_birth DATE already; this is a safety check.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- ─── Doctor settings: set booking_link_active = true for onboarded doctors ─────
-- Allow doctors who completed onboarding (step >= 3) to have active booking links
-- without admin approval gate (MVP simplification)
UPDATE doctors
  SET booking_link_active = true
  WHERE onboarding_step >= 3 AND is_active = true;

-- ─── Appointments: ensure slot_held_until column exists ───────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS slot_held_until TIMESTAMPTZ;

-- ─── Appointments: add consultation_type_id column linking to consultation_types
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS consultation_type_id UUID REFERENCES consultation_types(id) ON UPDATE CASCADE ON DELETE SET NULL;
