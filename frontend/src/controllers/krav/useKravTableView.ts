// src/controllers/useKravTableView.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { useKravList } from '@/hooks/useKrav';
import { useSvarIndicatorByStycke } from '@/hooks/useSvar';
import { useBrind } from '@/components/toast/useBrindToast';
import { type Svar } from '@/types/domainTypes';

type CellRef = HTMLInputElement | HTMLButtonElement | null;

export const useKravTableView = (styckeId: number) => {
  const { data: kravList = [] } = useKravList(styckeId);
  const { data: svarList = [] } = useSvarIndicatorByStycke(styckeId);
  const { showWarning } = useBrind();

  // Accepts both forms: {kravId} or {krav:{id}}
  type SvarLike = Svar & { kravId?: number; krav?: { id: number } };

  const svarMap = useMemo(() => {
    const map = new Map<number, Svar>();
    for (const s of svarList as SvarLike[]) {
      const kid = s.kravId ?? s.krav?.id;
      if (kid != null) map.set(kid, s as Svar);
    }
    return map;
  }, [svarList]);

  const inputRefs = useRef<Array<Array<CellRef>>>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Initialize matrix of refs: 6 editable columns per row
    inputRefs.current = kravList.map(() => new Array<CellRef>(6).fill(null));
  }, [kravList]);

  const focusNext = (row: number, col: number) => {
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= 6) {
      nextCol = 0;
      nextRow++;
    }

    if (nextRow < inputRefs.current.length) {
      const el = inputRefs.current[nextRow]?.[nextCol];
      if (el) setTimeout(() => (el as HTMLElement).focus(), 0);
    } else {
      const fallback = inputRefs.current[row]?.[0];
      if (fallback) setTimeout(() => (fallback as HTMLElement).focus(), 0);
    }
  };

  const onClickNewRow = () => {
    if (isCreating) {
      showWarning('Du skapar redan en rad.');
      return;
    }
    setIsCreating(true);
  };

  return {
    kravList,
    svarMap,
    inputRefs,
    isCreating,
    setIsCreating,
    focusNext,
    onClickNewRow,
  };
};
