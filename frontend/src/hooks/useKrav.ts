import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { Krav } from '@/types/domainTypes';

// ───────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────
type KravScope =
  | { styckeId: number; omradeId?: never; avsnittId?: never }
  | { styckeId?: never; omradeId: number; avsnittId?: never }
  | { styckeId?: never; omradeId?: never; avsnittId: number };

export type KravListFilter = Partial<KravScope> & {
  search?: string;
};

// ───────────────────────────────────────────────────────────
// Utils
// ───────────────────────────────────────────────────────────
const resolveScopeParam = (f: KravListFilter) => {
  if (typeof f.styckeId === 'number') return { key: 'styckeId' as const, value: f.styckeId };
  if (typeof f.omradeId === 'number') return { key: 'omradeId' as const, value: f.omradeId };
  if (typeof f.avsnittId === 'number') return { key: 'avsnittId' as const, value: f.avsnittId };
  return null;
};

// ⚠️ Importante: queryKey **normalizada por valor**, NO por referencia del objeto
export const kravListKey = (filter: KravListFilter) => {
  const s = resolveScopeParam(filter);
  return ['kravList', s?.key ?? 'none', s?.value ?? 'none', filter.search ?? ''] as const;
};

// Fetcher reutilizable (para prefetch en el árbol)
export async function fetchKravList(filter: KravListFilter): Promise<Krav[]> {
  const scope = resolveScopeParam(filter);
  if (!scope) return [];
  const params: Record<string, number | string> = { [scope.key]: scope.value };
  if (filter.search) params.search = filter.search;
  const { data } = await apiClient.get<Krav[]>('/api/krav', { params });
  return data;
}

// ───────────────────────────────────────────────────────────
// Main hook (overloaded for compatibility)
// ───────────────────────────────────────────────────────────
export function useKravList(styckeId: number): ReturnType<typeof useKravListInternal>;
export function useKravList(filter: KravListFilter): ReturnType<typeof useKravListInternal>;

export function useKravList(arg: number | KravListFilter) {
  const filter: KravListFilter = typeof arg === 'number' ? { styckeId: arg } : arg;
  return useKravListInternal(filter);
}

function useKravListInternal(filter: KravListFilter) {
  const scope = resolveScopeParam(filter);
  const enabled = Boolean(scope);

  return useQuery<Krav[]>({
    queryKey: kravListKey(filter),
    enabled,
    queryFn: () => fetchKravList(filter),
    // 🔥 Mantén los datos actuales visibles mientras llega el nuevo resultado
    placeholderData: (prev) => prev,
    // Reduce refetches y parpadeos
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export const useKravUpdate = (kravId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { kravText: string; anvisning: string }) => {
      const response = await apiClient.put(`/api/krav/${kravId}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalida por prefijo estable (primer elemento de la key)
      queryClient.invalidateQueries({ queryKey: ['kravList'] });
    },
  });
};
