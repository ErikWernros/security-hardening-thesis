import { z } from 'zod';
import { kodSchema, namnSchema, idParams } from './common.schema';

export const createStyckeSchema = {
  body: z.object({
    omradeId: z.number().int().positive(),
    kod: kodSchema,
    namn: namnSchema,
  }),
};

export const updateStyckeSchema = {
  ...idParams,
  body: z
    .object({
      omradeId: z.number().int().positive().optional(),
      kod: kodSchema.optional(),
      namn: namnSchema.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'No fields to update'),
};

export const deleteStyckeSchema = {
  ...idParams,
};
