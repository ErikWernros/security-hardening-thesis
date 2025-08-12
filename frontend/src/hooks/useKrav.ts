import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Krav } from '@/types/domainTypes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useKravList = (styckeId: number) => {
  return useQuery<Krav[]>({
    queryKey: ['kravList', styckeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/krav?styckeId=${styckeId}`);
      return response.data;
    },
    enabled: !!styckeId,
  });
};

export const useKravUpdate = (kravId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { kravText: string; anvisning: string }) => {
      const response = await apiClient.put(`/api/krav/${kravId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kravList'] });
    },
  });
};
