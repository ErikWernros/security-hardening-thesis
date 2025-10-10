// src/schemas/krav.schema.ts
import { z } from 'zod';

// ============================================================
// Helpers
// ============================================================
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// exactly one of the 3 scope ids (for CREATE)
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

// at most one of the 3 scope ids (for UPDATE, since body is partial)
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
// MISMA estructura que tenías, ahora con 3 scopes opcionales
// ============================================================
const kravBodySchema = z.object({
  kod: z.string().min(1, { message: 'Code cannot be empty' }),
  kravText: z.string().min(1, { message: 'Requirement text cannot be empty' }),
  styckeId: z.coerce
    .number()
    .int()
    .positive({ message: 'Stycke ID must be a positive integer' })
    .optional(),
  avsnittId: z.coerce
    .number()
    .int()
    .positive({ message: 'Avsnitt ID must be a positive integer' })
    .optional(),
  omradeId: z.coerce
    .number()
    .int()
    .positive({ message: 'Område ID must be a positive integer' })
    .optional(),
  anvisning: z.string().nullable().optional(),
});

// ============================================================
// Schemas compuestos (MISMA estructura/export names)
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

// DELETE /krav/:id (sin cambios)
export const deleteKravSchema = z.object({
  params: kravParamsSchema,
});

// ============================================================
// Tipos inferidos (MISMA firma pública)
// ============================================================
export type CreateKravInput = z.infer<typeof createKravSchema>['body'];
export type UpdateKravInput = z.infer<typeof updateKravSchema>['body'];
export type UpdateKravParams = z.infer<typeof updateKravSchema>['params'];
export type DeleteKravParams = z.infer<typeof deleteKravSchema>['params'];
