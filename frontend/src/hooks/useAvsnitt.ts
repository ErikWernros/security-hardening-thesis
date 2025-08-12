import { useQuery } from '@tanstack/react-query';
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
