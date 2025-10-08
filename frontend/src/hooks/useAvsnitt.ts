import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Avsnitt } from '@/types/domainTypes';

export const useAvsnittList = (delId: number) => {
  return useQuery<Avsnitt[]>({
    queryKey: ['avsnittList', delId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/avsnitt?delId=${delId}`);
      return response.data;
    },
    enabled: !!delId,
  });
};

// ---- Mutations ----
type CreateAvsnittInput = { delId: number; kod: string; namn: string };
type UpdateAvsnittInput = { id: number; kod: string; namn: string };

export const useAvsnittCreate = () => {
  const qc = useQueryClient();
  return useMutation<Avsnitt, unknown, CreateAvsnittInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Avsnitt>('/api/avsnitt', data);
      return res.data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['avsnittList', data.delId] });
    },
  });
};

export const useAvsnittEdit = () => {
  const qc = useQueryClient();
  return useMutation<Avsnitt, unknown, UpdateAvsnittInput>({
    mutationFn: async (data) => {
      const res = await apiClient.put<Avsnitt>(`/api/avsnitt/${data.id}`, {
        kod: data.kod,
        namn: data.namn,
      });
      return res.data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['avsnittList', data.delId] });
    },
  });
};

export const useAvsnittDelete = () => {
  const qc = useQueryClient();
  // Suponemos que el backend devuelve { success:true, delId:number } para facilitar invalidación.
  return useMutation<{ success: boolean; delId?: number }, unknown, number>({
    mutationFn: async (id) => {
      const res = await apiClient.delete<{ success: boolean; delId?: number }>(
        `/api/avsnitt/${id}`,
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.delId) {
        void qc.invalidateQueries({ queryKey: ['avsnittList', data.delId] });
      } else {
        // fallback: invalidar todas
        void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'avsnittList' });
      }
    },
  });
};
