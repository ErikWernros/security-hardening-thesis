/** Reusable hooks for creating and deleting krav with @tanstack/react-query. Handles duplicate 409 code by returning the message from the backend. */

// src/hooks/useKravMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateKravDTO } from '@/types/domainTypes';
import { apiClient } from '@/lib/axios';
import type { KravListFilter } from '../useKrav';

// Input de creación: campos del Krav + scope (exactamente uno)
type CreateKravInput = Omit<CreateKravDTO, 'styckeId' | 'avsnittId' | 'omradeId'> & {
  styckeId?: number;
  avsnittId?: number;
  omradeId?: number;
};

// Normaliza un scope válido desde KravListFilter
const resolveScopePayload = (scope: KravListFilter) => {
  if (typeof scope.styckeId === 'number') return { styckeId: scope.styckeId };
  if (typeof scope.avsnittId === 'number') return { avsnittId: scope.avsnittId };
  if (typeof scope.omradeId === 'number') return { omradeId: scope.omradeId };
  return null;
};

export const useKravCreate = (scope: KravListFilter | number) => {
  const qc = useQueryClient();

  // Soporta compatibilidad previa: useKravCreate(styckeId: number)
  const scopeFilter: KravListFilter = typeof scope === 'number' ? { styckeId: scope } : scope;

  const scopePayload = resolveScopePayload(scopeFilter);

  return useMutation({
    mutationFn: async (payload: Omit<CreateKravInput, 'styckeId' | 'avsnittId' | 'omradeId'>) => {
      if (!scopePayload) {
        throw new Error('Missing scope for krav creation');
      }
      const { data } = await apiClient.post('/api/krav', { ...payload, ...scopePayload });
      return data as { id: number; kod: string };
    },
    onSuccess: () => {
      // Invalida la lista de kravs para cualquier scope (clave prefijada)
      qc.invalidateQueries({ queryKey: ['kravList'] });
    },
  });
};

export const useKravDelete = (styckeId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kravId: number) => {
      await apiClient.delete(`/api/krav/${kravId}`);
    },
    onSuccess: () => {
      if (styckeId) {
        qc.invalidateQueries({ queryKey: ['kravList', styckeId] });
      } else {
        qc.invalidateQueries({ queryKey: ['kravList'] });
      }
    },
  });
};
