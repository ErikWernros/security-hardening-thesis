// src/hooks/useOmrade.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Omrade } from '@/types/domainTypes';

/**
 * Lista de Områden por Avsnitt
 */
export const useOmradeList = (avsnittId: number) => {
  return useQuery<Omrade[]>({
    queryKey: ['omradeList', avsnittId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/omrade?avsnittId=${avsnittId}`);
      return response.data as Omrade[];
    },
    enabled: !!avsnittId,
  });
};

// ---- Mutations ----
type CreateOmradeInput = { avsnittId: number; kod: string; namn: string };
type UpdateOmradeInput = { id: number; kod: string; namn: string };

export const useOmradeCreate = () => {
  const qc = useQueryClient();
  return useMutation<Omrade, unknown, CreateOmradeInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Omrade>('/api/omrade', data);
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidar la lista del Avsnitt padre
      void qc.invalidateQueries({ queryKey: ['omradeList', data.avsnittId] });
    },
  });
};

export const useOmradeEdit = () => {
  const qc = useQueryClient();
  return useMutation<Omrade, unknown, UpdateOmradeInput>({
    mutationFn: async (data) => {
      const res = await apiClient.put<Omrade>(`/api/omrade/${data.id}`, {
        kod: data.kod,
        namn: data.namn,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidar la lista del Avsnitt padre del Område actualizado
      void qc.invalidateQueries({ queryKey: ['omradeList', data.avsnittId] });
    },
  });
};

export const useOmradeDelete = () => {
  const qc = useQueryClient();
  // Suponemos que el backend devuelve { success: true, avsnittId?: number }
  return useMutation<{ success: boolean; avsnittId?: number }, unknown, number>({
    mutationFn: async (id) => {
      const res = await apiClient.delete<{ success: boolean; avsnittId?: number }>(
        `/api/omrade/${id}`,
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.avsnittId != null) {
        void qc.invalidateQueries({ queryKey: ['omradeList', data.avsnittId] });
      } else {
        // Fallback: invalidar todas las listas de Område
        void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'omradeList' });
      }
    },
  });
};
