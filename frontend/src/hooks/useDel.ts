import { useQuery } from '@tanstack/react-query';
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
