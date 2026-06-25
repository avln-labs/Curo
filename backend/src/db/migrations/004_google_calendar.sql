-- Migration 004: Google Calendar OAuth & Meet integration
-- Run via: npm run db:migrate

-- ─── Doctors: add Google refresh token column ───────────────────────────────
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- ─── Appointments: add Google Calendar event ID column ──────────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);
