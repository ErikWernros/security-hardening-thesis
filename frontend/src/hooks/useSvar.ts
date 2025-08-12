import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type SvarInput, type Svar } from '@/types/domainTypes';

export const useSvarSave = (kravId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SvarInput) => {
      const response = await apiClient.put(`/api/svar/${kravId}`, data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kravList'] });
    },
  });
};

export const useSvarIndicatorByStycke = (styckeId: number) => {
  return useQuery<Svar[]>({
    queryKey: ['svarIndicator', styckeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/svar/stycke/${styckeId}`);
      return response.data;
    },
    enabled: !!styckeId,
  });
};
