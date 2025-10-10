import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { type Del } from '@/types/domainTypes';

interface AggregateData {
  del: string;
  medelbetyg: number;
}

export const useDelList = () => {
  return useQuery<Del[]>({
    queryKey: ['delList'],
    queryFn: async () => {
      const response = await apiClient.get('/api/del');
      return response.data;
    },
  });
};

export const useDelAggregate = () => {
  return useQuery<AggregateData[]>({
    queryKey: ['del-aggregate'],
    queryFn: async () => {
      const response = await apiClient.get('/api/del/aggregate');
      return response.data;
    },
  });
};

export const useDel = () => {
  const { data: delList, isLoading: listLoading, error: listError } = useDelList();
  const {
    data: aggregateData,
    isLoading: aggregateLoading,
    error: aggregateError,
  } = useDelAggregate();

  return {
    delList,
    aggregateData,
    isLoading: listLoading || aggregateLoading,
    error: listError || aggregateError,
  };
};
