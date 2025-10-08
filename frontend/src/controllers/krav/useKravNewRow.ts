// src/controllers/krav/useKravNewRow.ts
import { useRef, useState } from 'react';
import axios, { type AxiosError } from 'axios';
import { useKravCreate } from '@/hooks/mutations/useKravMutations';
import { useBrind } from '@/components/toast/useBrindToast';
import type { BackendError } from '@/types/domainTypes';
import type { KravListFilter } from '@/hooks/useKrav';

export const useKravNewRow = (
  scope: KravListFilter, // 👈 ahora acepta scope genérico
  onCancel: () => void,
  onSaved?: () => void,
) => {
  const [kod, setKod] = useState<string>('');
  const [kravText, setKravText] = useState<string>('');
  const [anvisning, setAnvisning] = useState<string>('');

  type CellRef = HTMLElement | null;
  const inputRefs = useRef<CellRef[]>([null, null, null]);
  const setCellRef = (col: number) => (el: HTMLElement | null) => {
    inputRefs.current[col] = el;
  };

  const kodRef = useRef<HTMLInputElement | null>(null);
  const create = useKravCreate(scope); // 👈 pasa el scope genérico
  const { showError, showSuccess, showWarning } = useBrind();

  const focusNext = (col: number) => {
    const next = (col + 1) % inputRefs.current.length;
    const el = inputRefs.current[next];
    if (el) {
      requestAnimationFrame(() => {
        (el as HTMLElement).focus();
        const maybe = el as HTMLInputElement | HTMLTextAreaElement;
        if (typeof maybe.select === 'function') {
          try {
            maybe.select();
          } catch {
            /* noop */
          }
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, col: number) => {
    const isPlainEnter =
      (e.key === 'Enter' || e.code === 'Enter') &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey;

    if (!isPlainEnter) return;
    e.preventDefault();
    if (col === inputRefs.current.length - 1) {
      void onSave();
    } else {
      focusNext(col);
    }
  };

  const validate = (): boolean => {
    if (!kod.trim() || !kravText.trim() || !anvisning.trim()) {
      showWarning('Du ska fylla i kod, krav och anvisning.');
      if (!kod.trim()) kodRef.current?.focus();
      return false;
    }
    return true;
  };

  const onSave = async (): Promise<void> => {
    if (!validate()) return;
    try {
      await create.mutateAsync({
        kod: kod.trim(),
        kravText: kravText.trim(),
        anvisning: anvisning.trim(),
      });
      showSuccess('¡Krav skapat korrekt!');
      onSaved?.();
    } catch (error: unknown) {
      if (axios.isAxiosError<BackendError>(error)) {
        const status = (error as AxiosError<BackendError>).response?.status;
        const message = (error as AxiosError<BackendError>).response?.data?.message;
        if (status === 409) {
          showError(`${message ?? 'Koden är redan registrerad.'}`);
          return;
        }
      }
      showError('Ett fel inträffade vid skapandet av kravet.');
    }
  };

  const onCancelClick = (): void => {
    onCancel();
    showWarning('Åtgärden avbröts.');
  };

  return {
    // state
    kod,
    setKod,
    kravText,
    setKravText,
    anvisning,
    setAnvisning,

    // refs + nav
    kodRef,
    setCellRef,
    handleKeyDown,

    // actions
    onSave,
    onCancelClick,
    create,
  };
};
