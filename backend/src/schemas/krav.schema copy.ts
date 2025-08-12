import { z } from 'zod';

// Params schema for krav routes (for URL params like /krav/:id)
export const kravParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'ID must be a positive integer' }),
});

// Body schema for krav (used for POST/PUT)
export const kravBodySchema = z.object({
  kod: z.string().min(1, { message: 'Code cannot be empty' }),
  kravText: z.string().min(1, { message: 'Requirement text cannot be empty' }),
  styckeId: z.coerce.number().int().positive({ message: 'Stycke ID must be a positive integer' }),
  anvisning: z.string().nullable().optional(),
});

// Schema for creating krav (POST)
export const createKravSchema = kravBodySchema;

// Schema for updating krav (PUT/PATCH)
export const updateKravSchema = z.object({
  params: kravParamsSchema,
  body: kravBodySchema.partial(),
});

// Types for use in controllers/services
export type CreateKravInput = z.infer<typeof createKravSchema>;
export type UpdateKravInput = z.infer<typeof updateKravSchema>['body'];
export type UpdateKravParams = z.infer<typeof updateKravSchema>['params'];
