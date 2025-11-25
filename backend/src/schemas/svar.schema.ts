// src/schemas/svar.schema.ts
import { z } from 'zod';

export const svarSchema = z
  .object({
    betyg: z
      .number()
      .min(0, { message: 'Betyg must be at least 0' })
      .max(5, { message: 'Betyg cannot exceed 5' })
      .nullable()
      .optional(),
    jaNej: z.boolean().optional(),
    kommentar: z
      .string()
      .max(1000, { message: 'Kommentar cannot exceed 1000 characters' })
      .refine((val) => !/<script|javascript:/i.test(val), {
        message: 'Invalid characters detected in kommentar',
      })
      .optional(),
    verifikat: z
      .string()
      .max(500, { message: 'Verifikat cannot exceed 500 characters' })
      .optional(),
  })
  .strict(); // ← VIKTIGT: Förbjud extra fält

export type SvarInput = z.infer<typeof svarSchema>;
