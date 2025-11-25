// src/schemas/krav.schema.ts
import { z } from 'zod';

// ============================================================
// Helpers
// ============================================================
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const hasExactlyOneScope = (v: {
  styckeId?: number | null;
  avsnittId?: number | null;
  omradeId?: number | null;
}) => {
  let c = 0;
  if (isNumber(v.styckeId)) c++;
  if (isNumber(v.avsnittId)) c++;
  if (isNumber(v.omradeId)) c++;
  return c === 1;
};

const hasAtMostOneScope = (v: {
  styckeId?: number | null;
  avsnittId?: number | null;
  omradeId?: number | null;
}) => {
  let c = 0;
  if (isNumber(v.styckeId)) c++;
  if (isNumber(v.avsnittId)) c++;
  if (isNumber(v.omradeId)) c++;
  return c <= 1;
};

// ============================================================
// Schema base para los parámetros de URL (reutilizable)
// ============================================================
const kravParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'ID must be a positive integer' }),
});

// ============================================================
// Schema base para el cuerpo de la petición de Krav (reutilizable)
// ============================================================
const kravBodySchema = z
  .object({
    kod: z
      .string()
      .min(1, { message: 'Code cannot be empty' })
      .max(50, { message: 'Code cannot exceed 50 characters' })
      .refine((val) => !/<script|javascript:/i.test(val), {
        message: 'Invalid characters detected in code',
      }),
    kravText: z
      .string()
      .min(1, { message: 'Requirement text cannot be empty' })
      .max(2000, { message: 'Requirement text cannot exceed 2000 characters' })
      .refine((val) => !/<script|javascript:/i.test(val), {
        message: 'Invalid characters detected in requirement text',
      }),
    styckeId: z.coerce
      .number()
      .int()
      .positive({ message: 'Stycke ID must be a positive integer' })
      .optional()
      .nullable(),
    avsnittId: z.coerce
      .number()
      .int()
      .positive({ message: 'Avsnitt ID must be a positive integer' })
      .optional()
      .nullable(),
    omradeId: z.coerce
      .number()
      .int()
      .positive({ message: 'Område ID must be a positive integer' })
      .optional()
      .nullable(),
    anvisning: z
      .string()
      .max(1000, { message: 'Anvisning cannot exceed 1000 characters' })
      .refine((val) => !val || !/<script|javascript:/i.test(val), {
        message: 'Invalid characters detected in anvisning',
      })
      .nullable()
      .optional(),
  })
  .strict(); // ← NYTT: Förbjud extra fält

// ============================================================
// Schemas compuestos
// ============================================================

// POST /krav → exactamente UN scope
export const createKravSchema = z.object({
  body: kravBodySchema.superRefine((val, ctx) => {
    if (!hasExactlyOneScope(val)) {
      ctx.addIssue({
        code: 'custom',
        path: ['styckeId'],
        message: 'Provide exactly one of styckeId, avsnittId, or omradeId',
      });
    }
  }),
});

// PUT /krav/:id → body parcial; permitir 0 o 1 scope
export const updateKravSchema = z.object({
  params: kravParamsSchema,
  body: kravBodySchema.partial().superRefine((val, ctx) => {
    if (!hasAtMostOneScope(val)) {
      ctx.addIssue({
        code: 'custom',
        path: ['styckeId'],
        message: 'Provide at most one of styckeId, avsnittId, or omradeId',
      });
    }
  }),
});

// DELETE /krav/:id
export const deleteKravSchema = z.object({
  params: kravParamsSchema,
});

// ============================================================
// Tipos inferidos
// ============================================================
export type CreateKravInput = z.infer<typeof createKravSchema>['body'];
export type UpdateKravInput = z.infer<typeof updateKravSchema>['body'];
export type UpdateKravParams = z.infer<typeof updateKravSchema>['params'];
export type DeleteKravParams = z.infer<typeof deleteKravSchema>['params'];
