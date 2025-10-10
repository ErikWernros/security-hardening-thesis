// src/controllers/navigationtree/useStyckeController.ts
import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStyckeCreate, useStyckeEdit, useStyckeDelete } from '@/hooks/useStycke';
import { type Stycke } from '@/types/domainTypes';
import { useBrind } from '@/components/toast/useBrindToast';

type CreateInput = { omradeId: number; kod: string; namn: string };
type UpdateInput = { id: number; kod: string; namn: string };

export const useStyckeController = () => {
  const qc = useQueryClient();
  const { showSuccess, showError, showWarning } = useBrind();

  const create = useStyckeCreate();
  const update = useStyckeEdit();
  const remove = useStyckeDelete();

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
    async (omradeId?: number) => {
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'styckeList' });
      if (omradeId) await qc.invalidateQueries({ queryKey: ['styckeList', omradeId] });
    },
    [qc],
  );

  const createStycke = useCallback(
    async (payload: CreateInput): Promise<Stycke | undefined> => {
      if (!validate(payload)) return;
      try {
        const res = await create.mutateAsync(payload); // res: Stycke
        await invalidateLists(res.omradeId);
        showSuccess('Stycke skapat.');
        return res;
      } catch {
        showError('Kunde inte skapa stycke.');
        return undefined;
      }
    },
    [create, invalidateLists, showSuccess, showError, validate],
  );

  const updateStycke = useCallback(
    async (payload: UpdateInput) => {
      if (!validate(payload)) return;
      try {
        const res = await update.mutateAsync(payload); // res: Stycke
        await invalidateLists(res.omradeId);
        showSuccess('Ändringar sparade.');
      } catch {
        showError('Kunde inte spara ändringarna.');
      }
    },
    [update, invalidateLists, showSuccess, showError, validate],
  );

  const deleteStycke = useCallback(
    async (id: number) => {
      try {
        const res = await remove.mutateAsync(id); // { success, omradeId? }
        await invalidateLists((res as { omradeId?: number } | undefined)?.omradeId);
        showSuccess('Stycke raderat.');
      } catch {
        showError('Kunde inte radera stycke.');
      }
    },
    [remove, invalidateLists, showSuccess, showError],
  );

  const isBusy = useMemo(
    () => create.isPending || update.isPending || remove.isPending,
    [create.isPending, update.isPending, remove.isPending],
  );

  return { createStycke, updateStycke, deleteStycke, isBusy };
};
