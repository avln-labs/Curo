-- ============================================================
-- CURO — Initial Database Schema (Migration 001)
-- Compatible with: PostgreSQL 15+ / Supabase
-- Run via: npm run db:migrate
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','ADMIN','DOCTOR','CLINIC_STAFF','PATIENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doctor_verification_status AS ENUM ('pending','verified','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consult_type AS ENUM ('online','in_person','follow_up');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male','female','other','prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'payment_pending','confirmed','in_progress','completed','cancelled','no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'created','authorized','captured','failed','refunded','partially_refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('push','whatsapp','email','sms','in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- USERS — auth identity layer
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile        VARCHAR(15) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE,
  role          user_role NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- OTP CODES — short-lived, single-use
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile      VARCHAR(15) NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,   -- bcrypt hash of the 6-digit OTP
  purpose     VARCHAR(20) NOT NULL DEFAULT 'login',  -- login | register
  attempts    SMALLINT DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_codes(mobile, expires_at);

-- ============================================================
-- REFRESH TOKENS — persistent session store
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,  -- SHA-256 of the raw token
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug                  VARCHAR(40) UNIQUE NOT NULL,
  full_name             VARCHAR(255) NOT NULL DEFAULT '',
  profile_photo_url     TEXT,
  qualifications        TEXT[] DEFAULT '{}',
  specialisations       TEXT[] DEFAULT '{}',
  registration_number   VARCHAR(50),
  registration_council  VARCHAR(100),
  clinic_name           VARCHAR(255),
  city                  VARCHAR(100),
  bio                   VARCHAR(500),
  languages             TEXT[] DEFAULT '{}',
  -- Verification
  verification_status   doctor_verification_status DEFAULT 'pending',
  verification_note     TEXT,    -- internal admin note
  verified_at           TIMESTAMPTZ,
  verified_by           UUID REFERENCES users(id),
  rejection_reason      TEXT,
  -- Status
  is_active             BOOLEAN DEFAULT true,
  booking_link_active   BOOLEAN DEFAULT false,
  onboarding_step       SMALLINT DEFAULT 0,   -- 0=fresh, 1=profile, 2=fees, 3=schedule, 4=payment
  -- Ratings
  average_rating        DECIMAL(3,2) DEFAULT 0,
  review_count          INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON doctors(slug);
CREATE INDEX IF NOT EXISTS idx_doctors_verification ON doctors(verification_status);

-- ============================================================
-- DOCTOR VERIFICATION HISTORY — audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_verification_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  action        VARCHAR(30) NOT NULL,   -- submitted | approved | rejected | suspended
  performed_by  UUID REFERENCES users(id),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONSULTATION TYPES — per doctor fee config
-- ============================================================
CREATE TABLE IF NOT EXISTS consultation_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  type              consult_type NOT NULL,
  fee               DECIMAL(10,2) NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 15,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, type)
);

-- ============================================================
-- DOCTOR SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS doctor_schedule_breaks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID NOT NULL REFERENCES doctor_schedules(id) ON DELETE CASCADE,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS doctor_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  blocked_date  DATE NOT NULL,
  reason        VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, blocked_date)
);

CREATE TABLE IF NOT EXISTS doctor_settings (
  doctor_id                   UUID PRIMARY KEY REFERENCES doctors(id) ON DELETE CASCADE,
  buffer_minutes              INTEGER DEFAULT 5,
  max_patients_per_day        INTEGER DEFAULT 30,
  min_booking_advance_minutes INTEGER DEFAULT 30,
  cancellation_window_hours   INTEGER DEFAULT 2,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name     VARCHAR(255) NOT NULL DEFAULT '',
  date_of_birth DATE,
  age           SMALLINT,
  gender        gender_type,
  blood_group   VARCHAR(5),
  allergies     TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS (scaffold — wired in Phase 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id               UUID NOT NULL REFERENCES doctors(id),
  patient_id              UUID NOT NULL REFERENCES patients(id),
  consultation_type_id    UUID REFERENCES consultation_types(id),
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
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================================
-- DOCUMENTS (scaffold — wired in Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  appointment_id    UUID REFERENCES appointments(id),
  original_name     VARCHAR(255) NOT NULL,
  storage_key       TEXT NOT NULL,
  mime_type         VARCHAR(100) NOT NULL,
  file_size_bytes   INTEGER NOT NULL,
  virus_scan_status VARCHAR(20) DEFAULT 'pending',
  is_deleted        BOOLEAN DEFAULT false,
  uploaded_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRESCRIPTIONS (scaffold — wired in Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
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
  verify_token      VARCHAR(32) UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 32),
  is_amended        BOOLEAN DEFAULT false,
  amended_by_rx_id  UUID REFERENCES prescriptions(id),
  sent_via_whatsapp BOOLEAN DEFAULT false,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, serial_number)
);

CREATE TABLE IF NOT EXISTS prescription_medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_name       VARCHAR(200) NOT NULL,
  dose            VARCHAR(100),
  frequency       VARCHAR(50),
  duration        VARCHAR(100),
  instructions    TEXT,
  sort_order      SMALLINT DEFAULT 0
);

-- ============================================================
-- PAYMENTS (scaffold — wired in Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id          UUID NOT NULL REFERENCES appointments(id),
  razorpay_order_id       VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id     VARCHAR(100) UNIQUE,
  amount                  INTEGER NOT NULL,
  currency                VARCHAR(3) DEFAULT 'INR',
  status                  payment_status DEFAULT 'created',
  platform_fee            INTEGER,
  doctor_payout_amount    INTEGER,
  refund_id               VARCHAR(100),
  refund_amount           INTEGER,
  refund_reason           TEXT,
  refunded_at             TIMESTAMPTZ,
  metadata                JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECORD SHARE LINKS (scaffold — wired in Phase 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS record_share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  token       VARCHAR(64) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  accessed_at TIMESTAMPTZ,
  accessed_by UUID REFERENCES users(id),
  is_revoked  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS (scaffold)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  request_id  VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
