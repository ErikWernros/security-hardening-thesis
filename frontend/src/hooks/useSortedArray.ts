import { useMemo } from 'react';

/**
 * React Hook to sort an array by a given key.
 * @param arr The array to sort
 * @param key The object key to sort by
 * @param order Sorting order: 'asc' | 'desc'
 */
export const useSortedArray = <T, K extends keyof T>(
  arr: T[],
  key: K,
  order: 'asc' | 'desc' = 'asc',
) => {
  return useMemo(() => {
    return [...arr].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA == null && valB == null) return 0;
      if (valA == null) return order === 'asc' ? 1 : -1;
      if (valB == null) return order === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return order === 'asc' ? valA - valB : valB - valA;
      }

      if (valA instanceof Date && valB instanceof Date) {
        return order === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      }

      const result = String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return order === 'asc' ? result : -result;
    });
  }, [arr, key, order]);
};
