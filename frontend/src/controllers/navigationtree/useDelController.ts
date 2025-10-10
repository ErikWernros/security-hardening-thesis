// src/controllers/navigationtree/useDelController.ts
import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDelCreate, useDelEdit, useDelDelete } from '@/hooks/useDel';
import { useBrind } from '@/components/toast/useBrindToast';

type CreateInput = { kod: string; namn: string };
type UpdateInput = { id: number; kod: string; namn: string };

export const useDelController = () => {
  const qc = useQueryClient();
  const { showSuccess, showError, showWarning } = useBrind();

  const create = useDelCreate();
  const update = useDelEdit();
  const remove = useDelDelete();

  // ✅ Memoiza validate to satisfy exhaustive-deps
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

  const createDel = useCallback(
    async (payload: CreateInput) => {
      if (!validate(payload)) return;
      try {
        await create.mutateAsync(payload);
        await qc.invalidateQueries({ queryKey: ['delList'] });
        showSuccess('Del skapad.');
      } catch {
        showError('Kunde inte skapa del.');
      }
    },
    [create, qc, showSuccess, showError, validate],
  );

  const updateDel = useCallback(
    async (payload: UpdateInput) => {
      if (!validate(payload)) return;
      try {
        await update.mutateAsync(payload);
        await qc.invalidateQueries({ queryKey: ['delList'] });
        showSuccess('Ändringar sparade.');
      } catch {
        showError('Kunde inte spara ändringarna.');
      }
    },
    [update, qc, showSuccess, showError, validate],
  );

  const deleteDel = useCallback(
    async (id: number) => {
      try {
        await remove.mutateAsync(id);
        await qc.invalidateQueries({ queryKey: ['delList'] });
        showSuccess('Del raderad.');
      } catch {
        showError('Kunde inte radera del.');
      }
    },
    [remove, qc, showSuccess, showError],
  );

  const isBusy = useMemo(
    () => create.isPending || update.isPending || remove.isPending,
    [create.isPending, update.isPending, remove.isPending],
  );

  return { createDel, updateDel, deleteDel, isBusy };
};
