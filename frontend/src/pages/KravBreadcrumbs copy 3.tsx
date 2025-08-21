// src/pages/KravBreadcrumbs.tsx
import * as React from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { type KravBreadcrumbsProps, type NodeBasic, type RawParents } from '@/types/domainTypes';

// -------------------------------------
// Helpers
// -------------------------------------
/** Resolve breadcrumb props shape from lists */
function resolveBreadcrumbFromLists(
  delList: NodeBasic[],
  avsnittList: NodeBasic[],
  styckeList: NodeBasic[],
  ids: { delId: number; avsnittId: number; styckeId: number },
): KravBreadcrumbsProps['styckeParents'] {
  const del = delList.find((d) => d.id === ids.delId);
  const avsnitt = avsnittList.find((a) => a.id === ids.avsnittId);
  const stycke = styckeList.find((s) => s.id === ids.styckeId);
  if (!del || !avsnitt || !stycke) return null;

  return {
    delKod: del.kod,
    delNamn: del.namn,
    avsnittKod: avsnitt.kod,
    avsnittNamn: avsnitt.namn,
    styckeKod: stycke.kod,
    styckeNamn: stycke.namn,
  };
}

export const KravBreadcrumbs: React.FC<KravBreadcrumbsProps> = ({
  styckeParents,
  mobileHeightVh,
}) => {
  // Inline style only applied on mobile when mobileHeightVh is provided.
  const mobileStyle =
    typeof mobileHeightVh === 'number' ? { height: `${mobileHeightVh}vh` } : undefined;

  // -------------------------------------
  // Read current styckeId (URL has priority; fallback to localStorage)
  // NOTE: This component is remounted (key) when the selection changes,
  // so reading localStorage here is safe and reactive without changing props.
  // -------------------------------------
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlStyckeId = queryParams.get('styckeId');
  const selectedStyckeId = useMemo<number | null>(() => {
    if (urlStyckeId) return parseInt(urlStyckeId, 10);
    const stored = localStorage.getItem('selectedStyckeId');
    return stored ? parseInt(stored, 10) : null;
  }, [urlStyckeId]);

  // -------------------------------------
  // Query 1: Get parents IDs for current stycke
  // Return { delId, avsnittId }
  // -------------------------------------
  const {
    data: parentsIds,
    isLoading: isLoadingParentsIds,
    isFetching: isFetchingParentsIds,
  } = useQuery<RawParents | null>({
    queryKey: ['styckeParentsIds', selectedStyckeId],
    queryFn: async () => {
      if (!selectedStyckeId) return null;
      const res = await apiClient.get<RawParents>(`/api/stycke/${selectedStyckeId}/parents`);
      return res.data ?? null;
    },
    // If parent provides styckeParents, skip resolving here.
    enabled: !!selectedStyckeId && !styckeParents,
  });

  // -------------------------------------
  // Query 2: Resolve names/codes for breadcrumb using existing lists
  // Use /api/del, /api/avsnitt?delId, /api/stycke?avsnittId
  // and filter by IDs to obtain {code, name}
  // -------------------------------------
  const {
    data: resolvedParents,
    isLoading: isLoadingResolved,
    isFetching: isFetchingResolved,
  } = useQuery<KravBreadcrumbsProps['styckeParents']>({
    queryKey: ['styckeParentsResolved', parentsIds?.delId, parentsIds?.avsnittId, selectedStyckeId],
    queryFn: async () => {
      if (!selectedStyckeId || !parentsIds?.delId || !parentsIds?.avsnittId) return null;

      const delId = parentsIds.delId;
      const avsnittId = parentsIds.avsnittId;

      const [delListRes, avsnittListRes, styckeListRes] = await Promise.all([
        apiClient.get<NodeBasic[]>(`/api/del`),
        apiClient.get<NodeBasic[]>(`/api/avsnitt`, { params: { delId } }),
        apiClient.get<NodeBasic[]>(`/api/stycke`, { params: { avsnittId } }),
      ]);

      return resolveBreadcrumbFromLists(delListRes.data, avsnittListRes.data, styckeListRes.data, {
        delId,
        avsnittId,
        styckeId: selectedStyckeId,
      });
    },
    enabled: !!selectedStyckeId && !!parentsIds?.delId && !!parentsIds?.avsnittId && !styckeParents,
  });

  // Prefer explicit props if provided; otherwise use resolved data
  const effectiveParents = styckeParents ?? resolvedParents ?? null;

  // -------------------------------------
  // FIX: Avoid placeholder flicker
  // - If there is no selection, render nothing.
  // - If we must resolve data and queries are still loading/fetching, render nothing.
  // This prevents showing "Del / Avsnitt / Stycke" placeholders before data arrives.
  // -------------------------------------
  const isResolvingRemotely =
    !styckeParents &&
    !!selectedStyckeId &&
    (isLoadingParentsIds ||
      isFetchingParentsIds ||
      isLoadingResolved ||
      isFetchingResolved ||
      (!!selectedStyckeId && !parentsIds)); // waiting first query result

  if (!selectedStyckeId) {
    // No selection -> don't render breadcrumbs (prevents placeholders).
    return null;
  }

  if (isResolvingRemotely && !effectiveParents) {
    // Still loading async data -> render nothing to avoid flicker.
    return null;
  }

  if (!effectiveParents) {
    // Safety: if after resolving we still don't have data, don't render placeholders.
    return null;
  }

  return (
    <nav
      aria-label='Brödsmulor'
      className='
        flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto
        px-2 py-1 leading-tight
        sm:px-3 sm:py-1.5
        md:px-4 md:py-2
      '
      style={mobileStyle}
    >
      <span className='truncate max-w-[40vw] sm:max-w-[30vw] md:max-w-[30vw]'>
        {effectiveParents.delKod}
        {effectiveParents.delNamn ? ` – ${effectiveParents.delNamn}` : ''}
      </span>
      <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
      <span className='truncate max-w-[40vw] sm:max-w-[30vw] md:max-w-[30vw]'>
        {effectiveParents.avsnittKod}
        {effectiveParents.avsnittNamn ? ` – ${effectiveParents.avsnittNamn}` : ''}
      </span>
      <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
      <span className='truncate max-w-[48vw] sm:max-w-[40vw] md:max-w-[28vw] font-medium text-foreground'>
        {effectiveParents.styckeKod}
        {effectiveParents.styckeNamn ? ` – ${effectiveParents.styckeNamn}` : ''}
      </span>
    </nav>
  );
};
