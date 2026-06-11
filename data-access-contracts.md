# CURO Data Access Contracts

These contracts define how repositories should behave for the CURO PostgreSQL data layer.

## General Principles

- All repository methods must use parameterized SQL queries.
- Soft-delete must be respected by default: queries should exclude records with `deleted_at IS NOT NULL` unless explicitly requested.
- Updates should return the new row where possible and should not overwrite `created_at` values.
- Composite operations must use database transactions when multiple entities are changed together.
- Audit log writes should be generated for all sensitive writes in a transaction where available.
- Ownership validation should be performed by repository query predicates (e.g. doctor_id, clinic_id, patient_id) before returning sensitive records.

## UserRepository

Methods:
- `findById(userId)`
- `findByMobile(mobile)`
- `findByEmail(email)`
- `createUser(payload)`
- `updateUser(userId, updates)`
- `deactivateUser(userId)`
- `softDeleteUser(userId)`

Behavior:
- `findBy*` returns only active records by default.
- `createUser` must enforce `mobile` uniqueness.
- `softDeleteUser` sets `deleted_at` and `is_active = false`.

## ClinicRepository

Methods:
- `findById(clinicId)`
- `findBySlug(slug)`
- `listClinics(filters)`
- `createClinic(payload)`
- `updateClinic(clinicId, updates)`
- `deactivateClinic(clinicId)`

Behavior:
- Clinic operations are clinic-scoped and should not expose doctors or patients outside the clinic unless the user is an admin.

## DoctorRepository

Methods:
- `findById(doctorId)`
- `findBySlug(slug)`
- `listDoctors(filters)`
- `createDoctor(payload)`
- `updateDoctor(doctorId, updates)`
- `deactivateDoctor(doctorId)`
- `listDoctorsByClinic(clinicId)`

Behavior:
- Doctor queries should include `clinic_id` when available for clinic tenancy.
- `deactivateDoctor` must preserve appointment history and not delete dependent records.

## PatientRepository

Methods:
- `findById(patientId)`
- `findByUserId(userId)`
- `findByMobile(mobile)`
- `listPatients(filters)`
- `createPatient(payload)`
- `updatePatient(patientId, updates)`
- `softDeletePatient(patientId)`

Behavior:
- Patient records should be accessible by doctors only when there is an ownership or shared relationship.
- `findByMobile` should support returning a patient across doctors.

## AppointmentRepository

Methods:
- `createAppointment(payload)`
- `findById(appointmentId)`
- `findByDoctorAndDate(doctorId, date)`
- `findUpcomingByDoctor(doctorId, now, limit)`
- `findByPatient(patientId, filters)`
- `updateStatus(appointmentId, status, updates)`
- `cancelAppointment(appointmentId, cancelledBy, reason)`
- `releaseHeldSlot(appointmentId)`

Behavior:
- Enforce uniqueness for `(doctor_id, slot_date, slot_time)`.
- Include `clinic_id` from doctor and appointment payload if possible.
- Status transitions should be validated at the service layer, but repository updates must persist only valid statuses.

## ConsultationSessionRepository

Methods:
- `createSession(payload)`
- `findByAppointmentId(appointmentId)`
- `updateSession(appointmentId, updates)`
- `recordStart(appointmentId, startTime, roomId)`
- `recordCompletion(appointmentId, completedAt)`

Behavior:
- One session per appointment.
- Session update methods should preserve `created_at` and update `updated_at`.

## ConsultationNoteRepository

Methods:
- `appendNote(appointmentId, authorId, content)`
- `findNotesForAppointment(appointmentId)`
- `findLatestNoteForAppointment(appointmentId)`

Behavior:
- Notes are versioned; each save creates a new row.
- Soft deletes are possible for audit purposes but notes are preserved.

## PrescriptionRepository

Methods:
- `createPrescription(payload)`
- `findById(prescriptionId)`
- `listByPatient(patientId, filters)`
- `listByDoctor(doctorId, filters)`
- `amendPrescription(parentId, payload)`

Behavior:
- `serial_number` must be unique per doctor.
- Amendments reference `parent_prescription_id`.

## MedicationRepository

Methods:
- `findMedicationById(medicationId)`
- `findByDrugName(drugName)`
- `listCatalog(filters)`
- `createCatalogMedication(payload)`
- `createPrescriptionMedications(prescriptionId, medications)`

Behavior:
- Medication catalog is a shared reference list.
- Prescription medication records may copy drug name and controlled substance flags.

## PaymentRepository

Methods:
- `createPayment(payload)`
- `findById(paymentId)`
- `findByAppointmentId(appointmentId)`
- `listByPatient(patientId, filters)`
- `updatePaymentStatus(paymentId, status, updates)`

Behavior:
- `provider_payment_id` must be unique.
- Payment lifecycle changes should be persistent and auditable.

## PayoutRepository

Methods:
- `createPayout(payload)`
- `findById(payoutId)`
- `listByDoctor(doctorId, filters)`
- `updatePayoutStatus(payoutId, status, updates)`

Behavior:
- Payouts are doctor-scoped and may reference clinics.
- Changes should not delete payout history.

## DocumentRepository

Methods:
- `createDocument(payload)`
- `findById(documentId)`
- `listByPatient(patientId, filters)`
- `listByAppointment(appointmentId)`
- `archiveDocument(documentId)`

Behavior:
- Store only object storage metadata and keys, never raw binary content.
- `archiveDocument` should set `deleted_at` and `status = 'archived'`.

## NotificationRepository

Methods:
- `createNotification(payload)`
- `findByUserId(userId, filters)`
- `markAsRead(notificationId)`
- `updateDeliveryStatus(notificationId, status, deliveredAt)`

Behavior:
- Notification creation should capture channel, event_type, and payload.
- Fetching by user filters out soft-deleted records.

## HealthThreadRepository

Methods:
- `appendEntry(payload)`
- `findByPatient(patientId, filters)`
- `findTimeline(patientId, limit, cursor)`
- `findByAppointment(appointmentId)`

Behavior:
- Entries are patient-centric and ordered by `created_at`.
- Visibility rules must be enforced by caller context.
- Entries referencing appointments, prescriptions, or documents should preserve the source foreign key.

## AiSummaryRepository

Methods:
- `createAiSummary(payload)`
- `findByAppointmentId(appointmentId)`
- `updateAiSummary(appointmentId, updates)`

Behavior:
- One AI summary per appointment.
- Store original text and edited text with editor metadata.

## RecordShareLinkRepository

Methods:
- `createShareLink(payload)`
- `findByToken(token)`
- `revokeShareLink(token)`
- `incrementViewCount(token)`

Behavior:
- Links expire by `expires_at` or after max views.
- `incrementViewCount` must be atomic.

## AuditLogRepository

Methods:
- `logAction(payload)`
- `findByEntity(entityType, entityId, filters)`
- `findByActor(actorUserId, filters)`

Behavior:
- Audit logs are append-only.
- No delete method should be exposed at the API layer.
- Changes payload should contain before/after snapshots where applicable.

## Multi-tenancy and Ownership

- Doctor-scoped repositories must include `doctor_id` ownership filters where relevant.
- Clinic-scoped repositories must include `clinic_id` ownership filters where relevant.
- Patient-scoped health thread and document queries must include `patient_id`.
- Platform-wide admin queries may bypass doctor/clinic filters but still exclude soft-deleted records.

## Compliance Notes

- Repository methods should never expose `deleted_at`-marked rows in standard reads.
- Sensitive document payloads are not stored in the database; only metadata and encrypted object references are persisted.
- All repository implementations should be designed to support encryption-at-rest for PII fields and GDPR-style data retention workflows.
