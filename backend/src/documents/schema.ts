import { z } from 'zod';

export const uploadMetaSchema = z.object({
  appointmentId: z.string().uuid().optional(),
});
