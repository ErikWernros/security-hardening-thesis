import { useEffect, useMemo, useRef, useState } from 'react';
import { useKravList, type KravListFilter } from '@/hooks/useKrav';
import {
  useSvarIndicatorByStycke,
  useSvarIndicatorByOmrade,
  useSvarIndicatorByAvsnitt,
} from '@/hooks/useSvar';
import { useBrind } from '@/components/toast/useBrindToast';
import { type Svar } from '@/types/domainTypes';

type CellRef = HTMLInputElement | HTMLButtonElement | null;

export function useKravTableView(styckeId: number): ReturnType<typeof useKravTableViewInternal>;
export function useKravTableView(
  filter: KravListFilter,
): ReturnType<typeof useKravTableViewInternal>;
export function useKravTableView(arg: number | KravListFilter) {
  const filter: KravListFilter = typeof arg === 'number' ? { styckeId: arg } : arg;
  return useKravTableViewInternal(filter);
}

function useKravTableViewInternal(filter: KravListFilter) {
  // Carga krav para el ámbito; con placeholderData en el hook no habrá parpadeo.
  const { data: kravList = [] } = useKravList(filter);

  // IDs para indicadores (hooks ya manejan enabled internamente)
  const styckeId = typeof filter.styckeId === 'number' ? filter.styckeId : 0;
  const omradeId = typeof filter.omradeId === 'number' ? filter.omradeId : 0;
  const avsnittId = typeof filter.avsnittId === 'number' ? filter.avsnittId : 0;

  const { data: svarListStycke = [] } = useSvarIndicatorByStycke(styckeId);
  const { data: svarListOmrade = [] } = useSvarIndicatorByOmrade(omradeId);
  const { data: svarListAvsnitt = [] } = useSvarIndicatorByAvsnitt(avsnittId);

  const svarList = useMemo(() => {
    if (styckeId) return svarListStycke;
    if (omradeId) return svarListOmrade;
    if (avsnittId) return svarListAvsnitt;
    return [];
  }, [styckeId, omradeId, avsnittId, svarListStycke, svarListOmrade, svarListAvsnitt]);

  type SvarLike = Svar & { kravId?: number; krav?: { id: number } };
  const svarMap = useMemo(() => {
    const map = new Map<number, Svar>();
    for (const s of svarList as SvarLike[]) {
      const kid = s.kravId ?? s.krav?.id;
      if (kid != null) map.set(kid, s as Svar);
    }
    return map;
  }, [svarList]);

  // Mantener la matriz de refs y solo **ajustar el largo** (no recrearla por completo)
  const inputRefs = useRef<Array<Array<CellRef>>>([]);
  useEffect(() => {
    const cols = 6;
    const next = inputRefs.current;
    // Asegura longitud
    if (next.length < kravList.length) {
      for (let i = next.length; i < kravList.length; i++)
        next[i] = new Array<CellRef>(cols).fill(null);
    } else if (next.length > kravList.length) {
      next.length = kravList.length;
    }
  }, [kravList.length]);

  const [isCreating, setIsCreating] = useState(false);
  const { showWarning } = useBrind();

  const focusNext = (row: number, col: number) => {
    let nextRow = row;
    let nextCol = col + 1;
    if (nextCol >= 6) {
      nextCol = 0;
      nextRow++;
    }
    const el = inputRefs.current[nextRow]?.[nextCol] ?? inputRefs.current[row]?.[0];
    if (el) setTimeout(() => (el as HTMLElement).focus(), 0);
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
}
