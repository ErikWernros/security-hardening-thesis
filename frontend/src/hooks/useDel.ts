import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Del } from '@/types/domainTypes';

export const useDelList = () => {
  return useQuery<Del[]>({
    queryKey: ['delList'],
    queryFn: async () => {
      const response = await apiClient.get('/api/del');
      return response.data;
    },
  });
};

// ---- Mutations ----
// Inputs estrictos
type CreateDelInput = { kod: string; namn: string };
type UpdateDelInput = { id: number; kod: string; namn: string };

// Create
export const useDelCreate = () => {
  const qc = useQueryClient();
  return useMutation<Del, unknown, CreateDelInput>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Del>('/api/del', data);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['delList'] });
    },
  });
};

// Edit
export const useDelEdit = () => {
  const qc = useQueryClient();
  return useMutation<Del, unknown, UpdateDelInput>({
    mutationFn: async (data) => {
      const res = await apiClient.put<Del>(`/api/del/${data.id}`, {
        kod: data.kod,
        namn: data.namn,
      });
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['delList'] });
    },
  });
};

// Delete
export const useDelDelete = () => {
  const qc = useQueryClient();
  return useMutation<{ success: true }, unknown, number>({
    mutationFn: async (id) => {
      const res = await apiClient.delete<{ success: true }>(`/api/del/${id}`);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['delList'] });
    },
  });
};
