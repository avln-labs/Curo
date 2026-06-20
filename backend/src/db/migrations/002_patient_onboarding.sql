-- ============================================================
-- CURO — Migration 002: Patient Onboarding + Profile Restrictions
-- Run via: npm run db:migrate
-- ============================================================

-- ── 1. Add tracking columns to users table ─────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mobile_changed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_changed_at   TIMESTAMPTZ;

-- ── 2. Extend patients table ────────────────────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gender_locked        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_locked           BOOLEAN NOT NULL DEFAULT false;

-- For existing patients who already have a name set, mark them complete
UPDATE patients
  SET onboarding_complete = true,
      gender_locked = (gender IS NOT NULL),
      age_locked    = (age IS NOT NULL)
  WHERE full_name IS NOT NULL AND full_name != '';

-- ── 3. Index for onboarding lookup ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
