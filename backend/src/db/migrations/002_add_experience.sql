-- Add experience_years to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
