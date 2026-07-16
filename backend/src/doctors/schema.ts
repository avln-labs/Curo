import { z } from 'zod';

// ─── Onboarding Step 1: Clinic Profile ──────────────────────────────────────

export const OnboardingProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  specialisations: z.array(z.string().min(1)).min(1, 'At least one specialisation is required'),
  city: z.string().min(2, 'City is required').max(100).optional(),
  email: z.string().email().optional(),
  // Optional slug override (auto-generated if not provided)
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  signatureBase64: z.string().optional(),
  bio: z.string().max(1000).optional(),
  qualifications: z.array(z.string()).min(1, 'At least one qualification (e.g. MBBS) is required'),
  languages: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(100).optional(),
});

export type OnboardingProfileData = z.infer<typeof OnboardingProfileSchema>;

// ─── Onboarding Step 2: Consultation Fees ────────────────────────────────────

const ConsultationTypeSchema = z.object({
  type: z.enum(['online', 'in_person', 'follow_up']),
  fee: z.number().min(50, 'Minimum fee is ₹50').max(50000, 'Maximum fee is ₹50,000'),
  durationMinutes: z.number().int().min(5).max(120).default(15),
  isActive: z.boolean().default(true),
});

export const OnboardingFeesSchema = z.object({
  consultationTypes: z
    .array(ConsultationTypeSchema)
    .min(1, 'At least one consultation type is required'),
});

export type OnboardingFeesData = z.infer<typeof OnboardingFeesSchema>;

// ─── Onboarding Step 3: Schedule ─────────────────────────────────────────────

const ScheduleDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),  // 0=Sun, 6=Sat
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  isActive: z.boolean().default(true),
  breaks: z
    .array(
      z.object({
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .default([]),
});

export const OnboardingScheduleSchema = z.object({
  schedule: z.array(ScheduleDaySchema),
  bufferMinutes: z.number().int().min(0).max(30).default(0),
  maxPatientsPerDay: z.number().int().min(1).max(100).default(50),
  minBookingAdvanceMinutes: z.number().int().min(0).max(1440).default(0),
});

export type OnboardingScheduleData = z.infer<typeof OnboardingScheduleSchema>;

// ─── Doctor Profile Update (post-onboarding) ──────────────────────────────────

export const UpdateDoctorProfileSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  clinicName: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  specialisations: z.array(z.string()).optional(),
  email: z.string().email().optional(),
});

export type UpdateDoctorProfileData = z.infer<typeof UpdateDoctorProfileSchema>;

// ─── Block Dates ──────────────────────────────────────────────────────────────

export const BlockDatesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')),
  reason: z.string().max(255).optional(),
});

export type BlockDatesData = z.infer<typeof BlockDatesSchema>;
