/** Reusable hooks for creating and deleting krav with @tanstack/react-query. Handles duplicate 409 code by returning the message from the backend. */

// src/hooks/useKravMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateKravDTO } from '@/types/domainTypes';
import { apiClient } from '@/lib/axios';

export const useKravCreate = (styckeId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CreateKravDTO, 'styckeId'>) => {
      // Create krav via /api/krav (protected by Admin in your routes)
      const { data } = await apiClient.post('/api/krav', { ...payload, styckeId });
      return data as { id: number; kod: string };
    },
    onSuccess: () => {
      // Invalidate krav list for this stycke
      qc.invalidateQueries({ queryKey: ['kravList', styckeId] });
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
