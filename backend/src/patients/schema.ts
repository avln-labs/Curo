import { z } from 'zod';

// ── Initial onboarding (new patient, one-time) ────────────────────────────────
export const PatientOnboardingSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(255),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Please select a gender option' }),
  }),
  age: z.number({ invalid_type_error: 'Age must be a number' }).int().min(1).max(120),
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
  age:        z.number().int().min(1).max(120).optional(),
  gender:     z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

export type UpdatePatientProfileData = z.infer<typeof UpdatePatientProfileSchema>;
