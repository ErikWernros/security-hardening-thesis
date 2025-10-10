import { z } from 'zod';
import { kodSchema, namnSchema, idParams } from './common.schema';

// POST /del
export const createDelSchema = {
  body: z.object({
    kod: kodSchema,
    namn: namnSchema,
  }),
};

// PUT /del/:id
export const updateDelSchema = {
  ...idParams,
  body: z
    .object({
      kod: kodSchema.optional(),
      namn: namnSchema.optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'No fields to update'),
};

// DELETE /del/:id
export const deleteDelSchema = {
  ...idParams,
};
