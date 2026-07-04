-- ============================================================
-- 005 — AI Pre-Consult Summary + Document upload hardening
-- ============================================================

-- AI pre-consult summary is cached per appointment.
-- `ai_summary`         → machine-generated summary (never mutated by edits)
-- `ai_summary_edited`  → doctor-edited version (shown when present)
-- `ai_summary_status`  → pending | ready | fallback | insufficient
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_summary_edited TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_summary_status VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_summary_sources JSONB DEFAULT '[]';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;

-- Document lookup performance
CREATE INDEX IF NOT EXISTS idx_documents_patient   ON documents(patient_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_documents_appointment ON documents(appointment_id) WHERE is_deleted = false;
