// src/schemas/svar.schema.ts
import { z } from 'zod';

export const svarSchema = z.object({
  betyg: z.number().min(0).max(5).nullable(),
  jaNej: z.boolean(),
  kommentar: z.string(),
  verifikat: z.string(),
});

export type SvarInput = z.infer<typeof svarSchema>;
