// src/schemas/krav.schema.ts

import { z } from 'zod';

// Schema base para los parámetros de URL (reutilizable)
const paramsSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'ID must be a positive integer' }),
});

// Schema base para el cuerpo de la petición de Krav (reutilizable)
const bodySchema = z.object({
  kod: z.string().min(1, { message: 'Code cannot be empty' }),
  kravText: z.string().min(1, { message: 'Requirement text cannot be empty' }),
  styckeId: z.coerce.number().int().positive({ message: 'Stycke ID must be a positive integer' }),
  anvisning: z.string().nullable().optional(),
});

// ============================================================
// Schemas compuestos para cada ruta
// ============================================================

// Schema para la ruta POST /krav
export const createKravSchema = z.object({
  body: bodySchema,
});

// Schema para la ruta PUT /krav/:id
export const updateKravSchema = z.object({
  params: paramsSchema,
  body: bodySchema.partial(), // Hacemos el cuerpo parcial para permitir actualizaciones de campos individuales
});

// Schema para la ruta DELETE /krav/:id
export const deleteKravSchema = z.object({
  params: paramsSchema,
});

// ============================================================
// Tipos inferidos (ahora se extraen del schema compuesto)
// ============================================================
export type CreateKravInput = z.infer<typeof createKravSchema>['body'];
export type UpdateKravInput = z.infer<typeof updateKravSchema>['body'];
export type UpdateKravParams = z.infer<typeof updateKravSchema>['params'];
export type DeleteKravParams = z.infer<typeof deleteKravSchema>['params'];
