// src/pages/KravBreadcrumbs.tsx
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { type KravBreadcrumbsProps, type NodeBasic, type RawParents } from '@/types/domainTypes';

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

/** Read styckeId from URL or localStorage (URL has priority) */
function getSelectedStyckeId(locationSearch: string): number | null {
  const urlStyckeId = new URLSearchParams(locationSearch).get('styckeId');
  if (urlStyckeId) return parseInt(urlStyckeId, 10);
  const stored = localStorage.getItem('selectedStyckeId');
  return stored ? parseInt(stored, 10) : null;
}

export const KravBreadcrumbs: React.FC<KravBreadcrumbsProps> = ({
  styckeParents,
  mobileHeightVh,
}) => {
  // Inline style only on mobile when provided.
  const mobileStyle =
    typeof mobileHeightVh === 'number' ? { height: `${mobileHeightVh}vh` } : undefined;

  const location = useLocation();

  // ------------------------------------------------------------
  // FIX CORE: Track selectedStyckeId without remounts or parent props
  // - Poll localStorage lightly (150ms) because 'storage' does not fire in same tab.
  // - Also react when URL param changes.
  // - This avoids using <KravBreadcrumbs key=.../> and prevents flicker.
  // ------------------------------------------------------------
  const [selectedStyckeId, setSelectedStyckeId] = useState<number | null>(() =>
    getSelectedStyckeId(location.search),
  );

  useEffect(() => {
    // Immediate sync when URL changes
    setSelectedStyckeId(getSelectedStyckeId(location.search));

    // Lightweight polling to detect local updates from same tab
    let last = getSelectedStyckeId(location.search);
    const tick = () => {
      const curr = getSelectedStyckeId(location.search);
      if (curr !== last) {
        last = curr;
        setSelectedStyckeId(curr);
      }
    };
    const id = window.setInterval(tick, 150);

    // Listen storage for multi-tab changes (won't fire on same tab, but it is cheap)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'selectedStyckeId') tick();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', onStorage);
    };
  }, [location.search]);

  // ------------------------------------------------------------
  // Query 1: parent ids for current stycke (keep previous while fetching)
  // ------------------------------------------------------------
  const { data: parentsIds } = useQuery<RawParents | null>({
    queryKey: ['styckeParentsIds', selectedStyckeId],
    queryFn: async () => {
      if (!selectedStyckeId) return null;
      const res = await apiClient.get<RawParents>(`/api/stycke/${selectedStyckeId}/parents`);
      return res.data ?? null;
    },
    enabled: !!selectedStyckeId && !styckeParents,
    // Keep previous data during key change to avoid any visual jump.
    placeholderData: (prev) => prev,
  });

  // ------------------------------------------------------------
  // Query 2: resolve codes/names (also keep previous while fetching)
  // ------------------------------------------------------------
  const { data: resolvedParents } = useQuery<KravBreadcrumbsProps['styckeParents']>({
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
    placeholderData: (prev) => prev,
  });

  // Prefer explicit props if provided; otherwise use resolved data
  const effectiveParents = styckeParents ?? resolvedParents ?? null;

  // If no selection yet, render nothing (no placeholders → no flicker).
  if (!selectedStyckeId || !effectiveParents) return null;

  return (
    <nav
      aria-label='Brödsmulor'
      className='
        flex text-sm text-muted-foreground
        px-2 py-1 leading-tight
        sm:px-3 sm:py-1.5
        md:px-4 md:py-2
      '
      style={mobileStyle}
    >
      {/* Mobile-first: vertical stack (wrap text, keep chevron at end of line) */}
      <div className='sm:hidden flex flex-col gap-1 w-full'>
        {/* Line 1: Del */}
        <div className='flex items-start gap-1'>
          <span className='min-w-0 whitespace-normal break-words'>
            {/* Show full text, never truncate */}
            {effectiveParents?.delKod ?? 'Del'}
            {effectiveParents?.delNamn ? ` – ${effectiveParents.delNamn}` : ''}
          </span>
          <ChevronRight className='h-4 w-4 shrink-0 opacity-60 mt-0.5' />
        </div>

        {/* Line 2: Avsnitt */}
        <div className='flex items-start gap-1'>
          <span className='min-w-0 whitespace-normal break-words'>
            {effectiveParents?.avsnittKod ?? 'Avsnitt'}
            {effectiveParents?.avsnittNamn ? ` – ${effectiveParents.avsnittNamn}` : ''}
          </span>
          <ChevronRight className='h-4 w-4 shrink-0 opacity-60 mt-0.5' />
        </div>

        {/* Line 3: Stycke (no chevron) */}
        <div className='flex items-start'>
          <span className='min-w-0 whitespace-normal break-words font-medium text-foreground'>
            {effectiveParents?.styckeKod ?? 'Stycke'}
            {effectiveParents?.styckeNamn ? ` – ${effectiveParents.styckeNamn}` : ''}
          </span>
        </div>
      </div>

      {/* ≥ sm: keep the original horizontal breadcrumb with truncation */}
      <div className='hidden sm:flex items-center gap-1 overflow-x-auto w-full'>
        <span className='truncate max-w-[40vw] sm:max-w-[30vw] md:max-w-[30vw]'>
          {effectiveParents?.delKod ?? 'Del'}
          {effectiveParents?.delNamn ? ` – ${effectiveParents.delNamn}` : ''}
        </span>
        <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
        <span className='truncate max-w-[40vw] sm:max-w-[30vw] md:max-w-[30vw]'>
          {effectiveParents?.avsnittKod ?? 'Avsnitt'}
          {effectiveParents?.avsnittNamn ? ` – ${effectiveParents.avsnittNamn}` : ''}
        </span>
        <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
        <span className='truncate max-w-[48vw] sm:max-w-[40vw] md:max-w-[28vw] font-medium text-foreground'>
          {effectiveParents?.styckeKod ?? 'Stycke'}
          {effectiveParents?.styckeNamn ? ` – ${effectiveParents.styckeNamn}` : ''}
        </span>
      </div>
    </nav>
  );
};
