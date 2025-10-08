// src/controllers/navigationtree/useAvsnittController.ts
import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAvsnittCreate, useAvsnittEdit, useAvsnittDelete } from '@/hooks/useAvsnitt';
import { type Avsnitt } from '@/types/domainTypes';
import { useBrind } from '@/components/toast/useBrindToast';

type CreateInput = { delId: number; kod: string; namn: string };
type UpdateInput = { id: number; kod: string; namn: string };

export const useAvsnittController = () => {
  const qc = useQueryClient();
  const { showSuccess, showError, showWarning } = useBrind();

  const create = useAvsnittCreate();
  const update = useAvsnittEdit();
  const remove = useAvsnittDelete();

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
    async (delId?: number) => {
      // Invalidate all avsnitt lists; and specifically the delId if known
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'avsnittList' });
      if (delId) await qc.invalidateQueries({ queryKey: ['avsnittList', delId] });
    },
    [qc],
  );

  const createAvsnitt = useCallback(
    async (payload: CreateInput): Promise<Avsnitt | undefined> => {
      if (!validate(payload)) return;
      try {
        const res = await create.mutateAsync(payload); // res: Avsnitt
        await invalidateLists(res.delId);
        showSuccess('Avsnitt skapat.');
        return res;
      } catch {
        showError('Kunde inte skapa avsnitt.');
        return undefined;
      }
    },
    [create, invalidateLists, showSuccess, showError, validate],
  );

  const updateAvsnitt = useCallback(
    async (payload: UpdateInput) => {
      if (!validate(payload)) return;
      try {
        const res = await update.mutateAsync(payload);
        await invalidateLists((res as { delId?: number } | undefined)?.delId);
        showSuccess('Ändringar sparade.');
      } catch {
        showError('Kunde inte spara ändringarna.');
      }
    },
    [update, invalidateLists, showSuccess, showError, validate],
  );

  const deleteAvsnitt = useCallback(
    async (id: number) => {
      try {
        const res = await remove.mutateAsync(id);
        await invalidateLists((res as { delId?: number } | undefined)?.delId);
        showSuccess('Avsnitt raderat.');
      } catch {
        showError('Kunde inte radera avsnitt.');
      }
    },
    [remove, invalidateLists, showSuccess, showError],
  );

  const isBusy = useMemo(
    () => create.isPending || update.isPending || remove.isPending,
    [create.isPending, update.isPending, remove.isPending],
  );

  return { createAvsnitt, updateAvsnitt, deleteAvsnitt, isBusy };
};
