// src/controllers/navigationtree/useOmradeController.ts
import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOmradeCreate, useOmradeEdit, useOmradeDelete } from '@/hooks/useOmrade';
import { type Omrade } from '@/types/domainTypes';
import { useBrind } from '@/components/toast/useBrindToast';

type CreateInput = { avsnittId: number; kod: string; namn: string };
type UpdateInput = { id: number; kod: string; namn: string };

export const useOmradeController = () => {
  const qc = useQueryClient();
  const { showSuccess, showError, showWarning } = useBrind();

  const create = useOmradeCreate();
  const update = useOmradeEdit();
  const remove = useOmradeDelete();

  const validate = useCallback(
    (vals: { kod?: string; namn?: string }) => {
      if (!vals.kod?.trim() || !vals.namn?.trim()) {
        showWarning('Du ska fylla i både kod och namn.');
        return false;
      }
      return true;
    },
    [showWarning],
  );

  const invalidateLists = useCallback(
    async (avsnittId?: number) => {
      // Invalidar todas las listas de områden; y específicamente la del avsnittId si se conoce
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'omradeList' });
      if (avsnittId) await qc.invalidateQueries({ queryKey: ['omradeList', avsnittId] });
    },
    [qc],
  );

  const createOmrade = useCallback(
    async (payload: CreateInput): Promise<Omrade | undefined> => {
      if (!validate(payload)) return;
      try {
        const res = await create.mutateAsync(payload); // res: Omrade
        await invalidateLists(res.avsnittId);
        showSuccess('Område skapat.');
        return res;
      } catch {
        showError('Kunde inte skapa område.');
        return undefined;
      }
    },
    [create, invalidateLists, showSuccess, showError, validate],
  );

  const updateOmrade = useCallback(
    async (payload: UpdateInput) => {
      if (!validate(payload)) return;
      try {
        const res = await update.mutateAsync(payload); // res: Omrade
        await invalidateLists(res.avsnittId);
        showSuccess('Ändringar sparade.');
      } catch {
        showError('Kunde inte spara ändringarna.');
      }
    },
    [update, invalidateLists, showSuccess, showError, validate],
  );

  const deleteOmrade = useCallback(
    async (id: number) => {
      try {
        const res = await remove.mutateAsync(id); // { success, avsnittId? }
        await invalidateLists((res as { avsnittId?: number } | undefined)?.avsnittId);
        showSuccess('Område raderat.');
      } catch {
        showError('Kunde inte radera område.');
      }
    },
    [remove, invalidateLists, showSuccess, showError],
  );

  const isBusy = useMemo(
    () => create.isPending || update.isPending || remove.isPending,
    [create.isPending, update.isPending, remove.isPending],
  );

  return { createOmrade, updateOmrade, deleteOmrade, isBusy };
};
