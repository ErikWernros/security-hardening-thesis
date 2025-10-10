import { z } from 'zod';
import { kodSchema, namnSchema, idParams } from './common.schema';

export const createOmradeSchema = {
  body: z.object({
    avsnittId: z.number().int().positive(),
    kod: kodSchema,
    namn: namnSchema,
  }),
};

export const updateOmradeSchema = {
  ...idParams,
  body: z
    .object({
      avsnittId: z.number().int().positive().optional(),
      kod: kodSchema.optional(),
      namn: namnSchema.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'No fields to update'),
};

export const deleteOmradeSchema = {
  ...idParams,
};
