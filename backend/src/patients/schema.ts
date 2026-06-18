import { z } from 'zod';

export const UpdatePatientProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string().min(1).max(100)).optional(),
  email: z.string().email().optional(),
});

export type UpdatePatientProfileData = z.infer<typeof UpdatePatientProfileSchema>;
