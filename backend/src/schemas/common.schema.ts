// src/schemas/common.schema.ts
import { z } from 'zod';

export const kodSchema = z
  .string()
  .min(1, { message: 'Kod is required' })
  .max(64, { message: 'Kod cannot exceed 64 characters' })
  .refine((val) => !/<script|javascript:/i.test(val), {
    message: 'Invalid characters detected in kod',
  })
  .trim();

export const namnSchema = z
  .string()
  .min(1, { message: 'Namn is required' })
  .max(255, { message: 'Namn cannot exceed 255 characters' })
  .refine((val) => !/<script|javascript:/i.test(val), {
    message: 'Invalid characters detected in namn',
  })
  .trim();

// Para params.id
export const idParams = {
  params: z
    .object({
      id: z
        .string()
        .regex(/^\d+$/, { message: 'ID must contain only digits' })
        .transform((v) => Number.parseInt(v, 10))
        .refine((v) => Number.isInteger(v) && v > 0, {
          message: 'ID must be a positive integer',
        }),
    })
    .strict(), // ← NYTT: Förbjud extra fält i params
};
