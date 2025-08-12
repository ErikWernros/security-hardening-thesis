import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Stycke } from '@/types/domainTypes';

export const useStyckeList = (avsnittId: number) => {
  return useQuery<Stycke[]>({
    queryKey: ['styckeList', avsnittId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/stycke?avsnittId=${avsnittId}`);
      return response.data;
    },
    enabled: !!avsnittId,
  });
};
