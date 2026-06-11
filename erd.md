# CURO ERD

## Entities

- users
- clinics
- doctors
- patients
- consultation_types
- doctor_schedules
- doctor_schedule_breaks
- doctor_blocked_dates
- doctor_settings
- appointments
- consultation_sessions
- consultation_notes
- prescriptions
- medication_catalog
- prescription_medications
- payments
- payouts
- documents
- health_thread_entries
- ai_summaries
- record_share_links
- notifications
- audit_logs

## Relationship Summary

users
  1 -> * doctors
  1 -> * patients
  1 -> * notifications
  1 -> * audit_logs

clinics
  1 -> * doctors
  1 -> * appointments
  1 -> * prescriptions
  1 -> * payments
  1 -> * payouts

doctors
  1 -> * consultation_types
  1 -> * doctor_schedules
  1 -> * doctor_blocked_dates
  1 -> 1 doctor_settings
  1 -> * appointments
  1 -> * prescriptions
  1 -> * payments
  1 -> * payouts

patients
  1 -> * appointments
  1 -> * prescriptions
  1 -> * payments
  1 -> * documents
  1 -> * health_thread_entries
  1 -> * record_share_links

appointments
  1 -> 1 consultation_sessions
  1 -> * consultation_notes
  1 -> * prescriptions
  1 -> * payments
  1 -> * documents
  1 -> 1 ai_summaries
  1 -> * health_thread_entries

prescriptions
  1 -> * prescription_medications
  1 -> * health_thread_entries

documents
  1 -> * health_thread_entries

## Entity Relationship Diagram

users
  id PK
  mobile
  email
  role

clinics
  id PK
  name
  slug

doctors
  id PK
  user_id FK -> users.id
  clinic_id FK -> clinics.id
  slug

patients
  id PK
  user_id FK -> users.id

appointments
  id PK
  doctor_id FK -> doctors.id
  patient_id FK -> patients.id
  clinic_id FK -> clinics.id

consultation_sessions
  id PK
  appointment_id FK -> appointments.id

prescriptions
  id PK
  appointment_id FK -> appointments.id
  patient_id FK -> patients.id
  doctor_id FK -> doctors.id
  clinic_id FK -> clinics.id

payments
  id PK
  appointment_id FK -> appointments.id
  patient_id FK -> patients.id
  doctor_id FK -> doctors.id
  clinic_id FK -> clinics.id

documents
  id PK
  patient_id FK -> patients.id
  appointment_id FK -> appointments.id

health_thread_entries
  id PK
  patient_id FK -> patients.id
  appointment_id FK -> appointments.id
  prescription_id FK -> prescriptions.id
  document_id FK -> documents.id

ai_summaries
  id PK
  appointment_id FK -> appointments.id
  patient_id FK -> patients.id
  doctor_id FK -> doctors.id

record_share_links
  id PK
  patient_id FK -> patients.id

notifications
  id PK
  user_id FK -> users.id

audit_logs
  id PK
  actor_user_id FK -> users.id

## Tenancy Model

CURO uses a hybrid model:

- Clinics group doctors and provide clinic-level reporting, payout aggregation, and administration.
- Doctors retain ownership of schedules, appointments, and prescription activity.
- Patient health threads are patient-centric and span doctors within the platform.

This hybrid approach supports clinic-managed practitioners while preserving a cross-doctor patient memory layer.
