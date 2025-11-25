// src/schemas/del.schema.ts
import { z } from 'zod';
import { kodSchema, namnSchema, idParams } from './common.schema';

// POST /del
export const createDelSchema = {
  body: z
    .object({
      kod: kodSchema,
      namn: namnSchema,
    })
    .strict(), // ← NYTT: Förbjud extra fält
};

// PUT /del/:id
export const updateDelSchema = {
  ...idParams,
  body: z
    .object({
      kod: kodSchema.optional(),
      namn: namnSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    })
    .strict(), // ← NYTT: Förbjud extra fält
};

// DELETE /del/:id
export const deleteDelSchema = {
  ...idParams,
};
