import { z } from 'zod';

// ── Initial onboarding (new patient, one-time) ────────────────────────────────
export const PatientOnboardingSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a gender option' }),
  }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD'),
});

export type PatientOnboardingData = z.infer<typeof PatientOnboardingSchema>;

// ── Profile update (after onboarding) ────────────────────────────────────────
// Gender and age are omitted — they can only be changed through the locked update.
export const UpdatePatientProfileSchema = z.object({
  fullName:   z.string().min(1).max(255).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies:  z.array(z.string().min(1).max(100)).optional(),
  email:      z.string().email('Invalid email address').optional(),
  // These are one-time: backend enforces lock; frontend shows them as read-only after first set
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender:     z.enum(['male', 'female', 'other']).optional(),
});

export type UpdatePatientProfileData = z.infer<typeof UpdatePatientProfileSchema>;
