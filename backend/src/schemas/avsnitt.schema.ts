import { z } from 'zod';
import { kodSchema, namnSchema, idParams } from './common.schema';

export const createAvsnittSchema = {
  body: z.object({
    delId: z.number().int().positive(),
    kod: kodSchema,
    namn: namnSchema,
  }),
};

export const updateAvsnittSchema = {
  ...idParams,
  body: z
    .object({
      delId: z.number().int().positive().optional(),
      kod: kodSchema.optional(),
      namn: namnSchema.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'No fields to update'),
};

export const deleteAvsnittSchema = {
  ...idParams,
};
