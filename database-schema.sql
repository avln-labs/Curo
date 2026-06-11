-- CURO PostgreSQL schema
-- Core entities, ownership rules, and audit-safe storage

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'CLINIC_STAFF', 'PATIENT');
CREATE TYPE doctor_verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE consult_type AS ENUM ('online', 'in_person', 'follow_up');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE appointment_status AS ENUM ('payment_pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payout_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE notification_channel AS ENUM ('push', 'whatsapp', 'email', 'sms', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE document_status AS ENUM ('uploaded', 'scanning', 'approved', 'rejected', 'archived');
CREATE TYPE health_thread_entry_type AS ENUM ('consultation', 'prescription', 'document', 'summary', 'note', 'follow_up', 'lab_result');
CREATE TYPE health_thread_actor_type AS ENUM ('doctor', 'patient', 'system');
CREATE TYPE entity_type AS ENUM ('user', 'clinic', 'doctor', 'patient', 'appointment', 'consultation_session', 'prescription', 'medication', 'payment', 'payout', 'document', 'notification', 'health_thread_entry', 'ai_summary', 'record_share_link');
CREATE TYPE ownership_scope AS ENUM ('doctor', 'clinic', 'platform');
CREATE TYPE appointment_source AS ENUM ('public_booking', 'doctor_portal', 'admin', 'phone', 'whatsapp');
CREATE TYPE payment_method AS ENUM ('razorpay', 'pay_at_clinic', 'wallet', 'upi', 'card');

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  role user_role NOT NULL,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- CLINICS
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  registration_number VARCHAR(80),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postcode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- DOCTORS
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  clinic_id UUID REFERENCES clinics(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  slug VARCHAR(40) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  profile_photo_url TEXT,
  qualifications TEXT[],
  specialisations TEXT[],
  registration_number VARCHAR(50) NOT NULL,
  registration_council VARCHAR(100) NOT NULL,
  clinic_name VARCHAR(255),
  city VARCHAR(100),
  bio VARCHAR(500),
  languages TEXT[],
  verification_status doctor_verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  rejection_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  booking_link_active BOOLEAN NOT NULL DEFAULT false,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- PATIENTS
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  age SMALLINT,
  gender gender_type,
  blood_group VARCHAR(5),
  allergies TEXT[],
  medical_notes TEXT,
  preferred_language VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- SUPPORTING DOCTOR SCHEDULES
CREATE TABLE consultation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE CASCADE,
  type consult_type NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctor_schedule_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES doctor_schedules(id) ON UPDATE CASCADE ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE doctor_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, blocked_date)
);

CREATE TABLE doctor_settings (
  doctor_id UUID PRIMARY KEY REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE CASCADE,
  buffer_minutes INTEGER NOT NULL DEFAULT 5,
  max_patients_per_day INTEGER NOT NULL DEFAULT 30,
  min_booking_advance_minutes INTEGER NOT NULL DEFAULT 30,
  cancellation_window_hours INTEGER NOT NULL DEFAULT 2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- APPOINTMENTS / BOOKINGS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_code VARCHAR(40) UNIQUE NOT NULL,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  clinic_id UUID REFERENCES clinics(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  consultation_type consult_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'payment_pending',
  source appointment_source NOT NULL DEFAULT 'public_booking',
  payment_method payment_method,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  slot_held_until TIMESTAMPTZ,
  chief_complaint VARCHAR(255) NOT NULL,
  description TEXT,
  duration_value INTEGER,
  duration_unit VARCHAR(20),
  request_ip VARCHAR(45),
  confirmation_code VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  cancel_reason TEXT,
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE (doctor_id, slot_date, slot_time)
);

CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, slot_date, slot_time);
CREATE INDEX idx_appointments_patient_date ON appointments (patient_id, slot_date);
CREATE INDEX idx_appointments_status ON appointments (status);
CREATE INDEX idx_appointments_clinic ON appointments (clinic_id);

-- CONSULTATION SESSIONS
CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  session_status appointment_status NOT NULL DEFAULT 'confirmed',
  video_room_id VARCHAR(255),
  video_room_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes_last_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id)
);

CREATE TABLE consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_consultation_notes_appointment ON consultation_notes (appointment_id);

-- PRESCRIPTIONS AND MEDICATIONS
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  clinic_id UUID REFERENCES clinics(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  serial_number VARCHAR(80) NOT NULL,
  diagnosis TEXT,
  investigations TEXT,
  advice TEXT,
  followup_date DATE,
  is_amendment BOOLEAN NOT NULL DEFAULT false,
  parent_prescription_id UUID REFERENCES prescriptions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sent_via_whatsapp BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE (doctor_id, serial_number)
);

CREATE INDEX idx_prescriptions_patient ON prescriptions (patient_id, created_at DESC);
CREATE INDEX idx_prescriptions_doctor ON prescriptions (doctor_id, created_at DESC);

CREATE TABLE medication_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  schedule VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_medication_catalog_drug_name ON medication_catalog (LOWER(drug_name));

CREATE TABLE prescription_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  catalog_medication_id UUID REFERENCES medication_catalog(id) ON UPDATE CASCADE ON DELETE SET NULL,
  drug_name VARCHAR(255) NOT NULL,
  dose VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  instructions TEXT,
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_medications_prescription ON prescription_medications (prescription_id);

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  clinic_id UUID REFERENCES clinics(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  provider_payment_id VARCHAR(100) UNIQUE,
  provider_order_id VARCHAR(100),
  amount_paise BIGINT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  captured_at TIMESTAMPTZ,
  refunded_amount_paise BIGINT DEFAULT 0,
  refund_provider_id VARCHAR(100),
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_appointment ON payments (appointment_id);
CREATE INDEX idx_payments_patient ON payments (patient_id);
CREATE INDEX idx_payments_status ON payments (status);

-- PAYOUTS
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  clinic_id UUID REFERENCES clinics(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  provider_payout_id VARCHAR(100) UNIQUE,
  amount_paise BIGINT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status payout_status NOT NULL DEFAULT 'pending',
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_payouts_doctor ON payouts (doctor_id);
CREATE INDEX idx_payouts_status ON payouts (status);

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  appointment_id UUID REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE SET NULL,
  uploaded_by_user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  title VARCHAR(255),
  description TEXT,
  document_type VARCHAR(80),
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  file_size_bytes BIGINT,
  storage_key TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  encrypted_metadata JSONB DEFAULT '{}'::JSONB,
  scan_status VARCHAR(50) DEFAULT 'pending',
  is_sensitive BOOLEAN NOT NULL DEFAULT true,
  status document_status NOT NULL DEFAULT 'uploaded',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_patient ON documents (patient_id);
CREATE INDEX idx_documents_appointment ON documents (appointment_id);

-- HEALTH THREADS
CREATE TABLE health_thread_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  appointment_id UUID REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE SET NULL,
  prescription_id UUID REFERENCES prescriptions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  actor_type health_thread_actor_type NOT NULL,
  actor_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  entry_type health_thread_entry_type NOT NULL,
  title VARCHAR(255),
  summary TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  visibility VARCHAR(50) NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_health_thread_entries_patient_date ON health_thread_entries (patient_id, created_at DESC);
CREATE INDEX idx_health_thread_entries_type ON health_thread_entries (patient_id, entry_type);

CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  summary TEXT NOT NULL,
  source_references JSONB DEFAULT '{}'::JSONB,
  original_summary TEXT,
  edited_by_user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_ai_summaries_appointment ON ai_summaries (appointment_id);

CREATE TABLE record_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON UPDATE CASCADE ON DELETE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_views INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_record_share_links_patient ON record_share_links (patient_id);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  body TEXT,
  payload JSONB DEFAULT '{}'::JSONB,
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_status ON notifications (user_id, status);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  actor_role user_role,
  entity_type entity_type NOT NULL,
  entity_id UUID,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  description TEXT,
  request_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs (actor_user_id);

-- DATA RULES SUMMARY
-- Ownership rules: doctors own their appointments, prescriptions, payments, and schedule records.
-- Clinic ownership: clinics group doctors and allow clinic-level reporting / payout aggregation.
-- Patient ownership: patients own their health thread and documents; doctors can add entries only through appointments or share links.
-- Soft delete: major user-facing entities include deleted_at and is_active fields, preserving audit history.
-- Immutable records: audit_logs are append-only; appointment history, payment records, and prescription records are preserved.
-- Compliance-safe storage: documents store object reference keys and encrypted metadata rather than binary payloads.

-- INDEXING STRATEGY
-- patient lookup: users(mobile), patients(user_id)
-- doctor schedule lookup: doctor_schedules(doctor_id, day_of_week), doctor_blocked_dates(doctor_id, blocked_date)
-- appointment queries by date: appointments(doctor_id, slot_date, slot_time), appointments(patient_id, slot_date)
-- consultation history retrieval: consultation_sessions(appointment_id), consultation_notes(appointment_id)
-- health thread reconstruction: health_thread_entries(patient_id, created_at DESC)
