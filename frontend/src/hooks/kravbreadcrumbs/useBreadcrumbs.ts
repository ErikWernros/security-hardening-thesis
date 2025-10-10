import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useDelList } from '@/hooks/useDel';
import { useAvsnittList } from '@/hooks/useAvsnitt';
import { useOmradeList } from '@/hooks/useOmrade';
import { useStyckeList, useStyckeParents } from '@/hooks/useStycke';
import { useAvsnittParents, useOmradeParents } from './useParents';
import type { KravListFilter } from '@/hooks/useKrav';
import type { RawParents } from '@/types/domainTypes';

type Segment = { label: string };
type NodeBasic = { id: number; kod: string; namn: string };

type Options = {
  /** Si ya tienes los parents del stycke, pásalos para evitar el round-trip */
  styckeParentsHint?: RawParents;
};

const STALE_TIME = 5 * 60 * 1000; // 5 min
const GC_TIME = 30 * 60 * 1000; // 30 min

export const useKravBreadcrumbSegments = (
  scope: KravListFilter | null,
  opts?: Options,
): Segment[] | null => {
  // Stable target identity to detect significant changes
  const idKey = useMemo(() => {
    if (!scope) return 'none';
    if ('styckeId' in scope) return `stycke-${scope.styckeId}`;
    if ('omradeId' in scope) return `omrade-${scope.omradeId}`;
    return `avsnitt-${scope.avsnittId}`;
  }, [scope]);

  // Last stable value to avoid visual flickering
  const last = useRef<Segment[] | null>(null);

  // 🔧 Reset internal cache when target changes
  useEffect(() => {
    last.current = null;
  }, [idKey]);

  // Stycke case: prefer track if it comes from props to skip a query
  const styckeId = scope && 'styckeId' in scope ? scope.styckeId : null;
  const skipStyParentsQuery = !!(styckeId && opts?.styckeParentsHint);
  const { data: styParents } = useStyckeParents(skipStyParentsQuery ? null : (styckeId ?? null));
  const resolvedStyParents = opts?.styckeParentsHint ?? styParents ?? null;

  // Område and Avsnitt
  const omradeId = scope && 'omradeId' in scope ? scope.omradeId : null;
  const avsnittId = scope && 'avsnittId' in scope ? scope.avsnittId : null;

  const { data: omrParents } = useOmradeParents(omradeId ?? null);
  const { data: avParents } = useAvsnittParents(avsnittId ?? null);

  // Lists by level
  const { data: delList = [] } = useDelList();

  const resolvedDelId = resolvedStyParents?.delId ?? omrParents?.delId ?? avParents?.delId ?? null;
  const { data: avsnittList = [] } = useAvsnittList(resolvedDelId ?? 0);

  const resolvedAvsnittId =
    resolvedStyParents?.avsnittId ?? omrParents?.avsnittId ?? avsnittId ?? null;
  const { data: omradeList = [] } = useOmradeList(resolvedAvsnittId ?? 0);

  const resolvedOmradeId = resolvedStyParents?.omradeId ?? omradeId ?? null;
  const { data: styckeList = [] } = useStyckeList(resolvedOmradeId ?? 0);

  const { data } = useQuery<Segment[] | null>({
    queryKey: [
      'kravBreadcrumbSegments',
      idKey,
      resolvedDelId ?? 0,
      resolvedAvsnittId ?? 0,
      resolvedOmradeId ?? 0,
    ],
    enabled: !!scope,
    // We use the last value as a placeholder; it is cleared with idKey
    placeholderData: last.current ?? null,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!scope) return last.current ?? null;

      const ensureNode = async (
        list: NodeBasic[] | undefined,
        id: number | undefined | null,
        path: string,
        params?: Record<string, unknown>,
      ): Promise<NodeBasic | null> => {
        if (!id) return null;
        const hit = list?.find((n) => n.id === id);
        if (hit) return hit;
        try {
          const res = await apiClient.get<NodeBasic[]>(path, { params });
          return res.data.find((n) => n.id === id) ?? null;
        } catch {
          return null;
        }
      };

      // 1) STYCKE
      if ('styckeId' in scope) {
        if (!resolvedStyParents) return last.current ?? null;

        const del = await ensureNode(delList, resolvedStyParents.delId, '/api/del');
        const av = await ensureNode(avsnittList, resolvedStyParents.avsnittId, '/api/avsnitt', {
          delId: resolvedStyParents.delId,
        });
        const omr = await ensureNode(omradeList, resolvedStyParents.omradeId, '/api/omrade', {
          avsnittId: resolvedStyParents.avsnittId,
        });
        const sty = await ensureNode(styckeList, scope.styckeId, '/api/stycke', {
          omradeId: resolvedStyParents.omradeId,
        });

        const segs =
          del && av && omr && sty
            ? [
                { label: `${del.kod} – ${del.namn}` },
                { label: `${av.kod} – ${av.namn}` },
                { label: `${omr.kod} – ${omr.namn}` },
                { label: `${sty.kod} – ${sty.namn}` },
              ]
            : null;

        if (segs) last.current = segs;
        return segs ?? last.current ?? null;
      }

      // 2) OMRÅDE
      if ('omradeId' in scope) {
        if (!omrParents) return last.current ?? null;

        const del = await ensureNode(delList, omrParents.delId, '/api/del');
        const av = await ensureNode(avsnittList, omrParents.avsnittId, '/api/avsnitt', {
          delId: omrParents.delId,
        });
        const omr = await ensureNode(omradeList, scope.omradeId, '/api/omrade', {
          avsnittId: omrParents.avsnittId,
        });

        const segs =
          del && av && omr
            ? [
                { label: `${del.kod} – ${del.namn}` },
                { label: `${av.kod} – ${av.namn}` },
                { label: `${omr.kod} – ${omr.namn}` },
              ]
            : null;

        if (segs) last.current = segs;
        return segs ?? last.current ?? null;
      }

      // 3) AVSNITT
      if ('avsnittId' in scope) {
        if (!avParents) return last.current ?? null;

        const del = await ensureNode(delList, avParents.delId, '/api/del');
        const av = await ensureNode(avsnittList, scope.avsnittId, '/api/avsnitt', {
          delId: avParents.delId,
        });

        const segs =
          del && av
            ? [{ label: `${del.kod} – ${del.namn}` }, { label: `${av.kod} – ${av.namn}` }]
            : null;

        if (segs) last.current = segs;
        return segs ?? last.current ?? null;
      }

      return last.current ?? null;
    },
  });

  return data ?? last.current ?? null;
};
