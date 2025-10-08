// src/hooks/useKravScope.ts
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type KravListFilter = { avsnittId: number } | { omradeId: number } | { styckeId: number };

const LS_KRAV_SCOPE = 'kravScope';

function readScopeFromLS(): KravListFilter | null {
  try {
    const raw = localStorage.getItem(LS_KRAV_SCOPE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      (Object.prototype.hasOwnProperty.call(parsed, 'styckeId') ||
        Object.prototype.hasOwnProperty.call(parsed, 'omradeId') ||
        Object.prototype.hasOwnProperty.call(parsed, 'avsnittId'))
    ) {
      return parsed as KravListFilter;
    }
    return null;
  } catch {
    return null;
  }
}

export const useKravScope = () => {
  const location = useLocation();
  const [scope, setScope] = useState<KravListFilter | null>(() => readScopeFromLS());

  useEffect(() => {
    let lastJSON = JSON.stringify(readScopeFromLS());

    const tick = () => {
      const curr = JSON.stringify(readScopeFromLS());
      if (curr !== lastJSON) {
        lastJSON = curr;
        setScope(curr ? (JSON.parse(curr) as KravListFilter) : null);
      }
    };

    const id = window.setInterval(tick, 150);
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KRAV_SCOPE) tick();
    };

    window.addEventListener('storage', onStorage);
    tick();

    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', onStorage);
    };
  }, [location.search]);

  return scope;
};
