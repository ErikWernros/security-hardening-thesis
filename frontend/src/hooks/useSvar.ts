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
      // Mantiene tu invalidation actual
      queryClient.invalidateQueries({ queryKey: ['kravList'] });
    },
  });
};

// ───────────────────────────────────────────────────────────
// Indicadores por nivel
// ───────────────────────────────────────────────────────────

// Los controladores devuelven { betyg, jaNej, verifikat, kommentar, kravId, userId }
export interface SvarWithKrav extends Svar {
  kravId: number;
}

// Stycke
export const useSvarIndicatorByStycke = (styckeId: number) => {
  return useQuery<SvarWithKrav[]>({
    queryKey: ['svarIndicator', 'stycke', styckeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/svar/stycke/${styckeId}`);
      return response.data as SvarWithKrav[];
    },
    enabled: !!styckeId,
  });
};

// Avsnitt
export const useSvarIndicatorByAvsnitt = (avsnittId: number) => {
  return useQuery<SvarWithKrav[]>({
    queryKey: ['svarIndicator', 'avsnitt', avsnittId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/svar/avsnitt/${avsnittId}`);
      return response.data as SvarWithKrav[];
    },
    enabled: !!avsnittId,
  });
};

// Område
export const useSvarIndicatorByOmrade = (omradeId: number) => {
  return useQuery<SvarWithKrav[]>({
    queryKey: ['svarIndicator', 'omrade', omradeId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/svar/omrade/${omradeId}`);
      return response.data as SvarWithKrav[];
    },
    enabled: !!omradeId,
  });
};
