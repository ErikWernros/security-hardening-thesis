import { z } from 'zod';

export const kodSchema = z.string().min(1, 'kod is required').max(64, 'kod too long');
export const namnSchema = z.string().min(1, 'namn is required').max(255, 'namn too long');

// Para params.id
export const idParams = {
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/)
      .transform((v) => Number.parseInt(v, 10))
      .refine((v) => Number.isInteger(v) && v > 0, 'Invalid id'),
  }),
};
