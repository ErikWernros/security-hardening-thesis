// src/hooks/useParents.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

type IdName = { id: number; kod: string; namn: string };

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 30 * 60 * 1000;

// 🔹 Avsnitt -> { delId }
export const useAvsnittParents = (avsnittId: number | null) => {
  return useQuery<{ delId: number } | null>({
    queryKey: ['avsnittParents', avsnittId],
    enabled: !!avsnittId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!avsnittId) return null;

      // 1) endpoint directo si existe
      try {
        const res = await apiClient.get<{ delId: number }>(`/api/avsnitt/${avsnittId}/parents`);
        if (res.data) return res.data;
      } catch {
        /* fallback */
      }

      // 2) recorrer listas
      const dels = (await apiClient.get<IdName[]>(`/api/del`)).data;
      for (const del of dels) {
        const avs = (await apiClient.get<IdName[]>(`/api/avsnitt`, { params: { delId: del.id } }))
          .data;
        if (avs.some((a) => a.id === avsnittId)) return { delId: del.id };
      }
      return null;
    },
  });
};

// 🔹 Område -> { delId, avsnittId }
export const useOmradeParents = (omradeId: number | null) => {
  return useQuery<{ delId: number; avsnittId: number } | null>({
    queryKey: ['omradeParents', omradeId],
    enabled: !!omradeId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!omradeId) return null;

      // 1) endpoint directo si existe
      try {
        const res = await apiClient.get<{ delId: number; avsnittId: number }>(
          `/api/omrade/${omradeId}/parents`,
        );
        if (res.data) return res.data;
      } catch {
        /* fallback */
      }

      // 2) recorrer listas
      const dels = (await apiClient.get<IdName[]>(`/api/del`)).data;
      for (const del of dels) {
        const avs = (await apiClient.get<IdName[]>(`/api/avsnitt`, { params: { delId: del.id } }))
          .data;
        for (const av of avs) {
          const omr = (
            await apiClient.get<IdName[]>(`/api/omrade`, { params: { avsnittId: av.id } })
          ).data;
          if (omr.some((o) => o.id === omradeId)) return { delId: del.id, avsnittId: av.id };
        }
      }
      return null;
    },
  });
};
