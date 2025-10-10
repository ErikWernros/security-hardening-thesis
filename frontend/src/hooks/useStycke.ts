import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Stycke, type RawParents } from '@/types/domainTypes';

// 🔹 Hook to obtain the parent (Område) of a Stycke
export const useStyckeList = (omradeId: number) => {
  return useQuery<Stycke[]>({
    queryKey: ['styckeList', omradeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/stycke?omradeId=${omradeId}`);
      return response.data;
    },
    enabled: !!omradeId,
  });
};

// 🔹 Hook to obtain the parents (Del, Avsnitt, Område) of a Stycke
export const useStyckeParents = (styckeId: number | null) => {
  return useQuery<RawParents | null>({
    queryKey: ['styckeParentsIds', styckeId],
    queryFn: async () => {
      if (!styckeId) return null;
      const res = await apiClient.get<RawParents>(`/api/stycke/${styckeId}/parents`);
      return res.data ?? null;
    },
    enabled: !!styckeId,
  });
};

// ---- Mutations ----
type CreateStyckeInput = { omradeId: number; kod: string; namn: string };
type UpdateStyckeInput = { id: number; kod: string; namn: string };

export const useStyckeCreate = () => {
  const qc = useQueryClient();
  return useMutation<Stycke, unknown, CreateStyckeInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Stycke>('/api/stycke', data);
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidar la lista del Område padre
      void qc.invalidateQueries({ queryKey: ['styckeList', data.omradeId] });
    },
  });
};

export const useStyckeEdit = () => {
  const qc = useQueryClient();
  return useMutation<Stycke, unknown, UpdateStyckeInput>({
    mutationFn: async (data) => {
      const res = await apiClient.put<Stycke>(`/api/stycke/${data.id}`, {
        kod: data.kod,
        namn: data.namn,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidar la lista del Område padre del Stycke actualizado
      void qc.invalidateQueries({ queryKey: ['styckeList', data.omradeId] });
    },
  });
};

export const useStyckeDelete = () => {
  const qc = useQueryClient();
  // Suponemos que el backend devuelve { success: true, omradeId?: number }
  return useMutation<{ success: boolean; omradeId?: number }, unknown, number>({
    mutationFn: async (id) => {
      const res = await apiClient.delete<{ success: boolean; omradeId?: number }>(
        `/api/stycke/${id}`,
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.omradeId != null) {
        void qc.invalidateQueries({ queryKey: ['styckeList', data.omradeId] });
      } else {
        // Fallback: invalidar todas las listas de Stycke
        void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'styckeList' });
      }
    },
  });
};
