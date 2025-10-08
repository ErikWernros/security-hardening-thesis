// src/controllers/useKravRow.ts
import { useEffect, useState } from 'react';
import { useSvarSave } from '@/hooks/useSvar';
import { useKravUpdate } from '@/hooks/useKrav';
import { useKravDelete } from '@/hooks/mutations/useKravMutations';
import { useBrind } from '@/components/toast/useBrindToast';
import type { Krav, Svar } from '@/types/domainTypes';

type CellRef = HTMLInputElement | HTMLButtonElement | null;

export const useKravRow = (
  krav: Krav,
  svar: Svar | undefined,
  rowIndex: number,
  inputRefs: React.RefObject<Array<Array<CellRef>>>,
  onEnterNext: (row: number, col: number) => void,
) => {
  const [formState, setFormState] = useState<{
    kravText: string;
    anvisning: string;
    betyg: string | number;
    jaNej: boolean;
    verifikat: string;
    kommentar: string;
  }>({
    kravText: krav.kravText ?? '',
    anvisning: krav.anvisning ?? '',
    betyg:
      (svar?.betyg ?? krav.svar?.betyg) !== null && (svar?.betyg ?? krav.svar?.betyg) !== undefined
        ? String(svar?.betyg ?? krav.svar?.betyg)
        : '',
    jaNej: svar?.jaNej ?? krav.svar?.jaNej ?? false,
    verifikat: svar?.verifikat ?? krav.svar?.verifikat ?? '',
    kommentar: svar?.kommentar ?? krav.svar?.kommentar ?? '',
  });

  useEffect(() => {
    if (!svar) return;
    setFormState((prev) => ({
      ...prev,
      betyg: svar.betyg !== null && svar.betyg !== undefined ? String(svar.betyg) : '',
      jaNej: svar.jaNej ?? false,
      verifikat: svar.verifikat ?? '',
      kommentar: svar.kommentar ?? '',
    }));
  }, [svar]); // ✅ incluir 'svar' resuelve el warning de exhaustive-deps

  const saveSvar = useSvarSave(krav.id);
  const updateKrav = useKravUpdate(krav.id);
  const { showSuccess, showError } = useBrind();
  const del = useKravDelete();

  const handleBlur = () => {
    const betygValue: number | null =
      typeof formState.betyg === 'string'
        ? Number.isFinite(Number(formState.betyg))
          ? Number(formState.betyg)
          : null
        : formState.betyg;

    saveSvar.mutate({
      betyg: betygValue,
      jaNej: formState.jaNej,
      verifikat: formState.verifikat,
      kommentar: formState.kommentar,
    });

    updateKrav.mutate({
      kravText: formState.kravText,
      anvisning: formState.anvisning,
    });
  };

  const setCellRef = (col: number) => (el: CellRef) => {
    if (!inputRefs.current[rowIndex])
      inputRefs.current[rowIndex] = new Array<CellRef>(6).fill(null);
    inputRefs.current[rowIndex][col] = el ?? null;
  };

  const handleKeyDown = (e: React.KeyboardEvent, col: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      onEnterNext(rowIndex, col);
    }
  };

  const onManualSave = async () => {
    try {
      const betygValue: number | null =
        typeof formState.betyg === 'string'
          ? Number.isFinite(Number(formState.betyg))
            ? Number(formState.betyg)
            : null
          : formState.betyg;

      await Promise.all([
        saveSvar.mutateAsync({
          betyg: betygValue,
          jaNej: formState.jaNej,
          verifikat: formState.verifikat,
          kommentar: formState.kommentar,
        }),
        updateKrav.mutateAsync({
          kravText: formState.kravText,
          anvisning: formState.anvisning,
        }),
      ]);

      showSuccess('Ändringar sparade.');
    } catch {
      showError('Kunde inte spara ändringarna.');
    }
  };

  const onDelete = async () => {
    try {
      await del.mutateAsync(krav.id);
      showSuccess('Raden har raderats.');
    } catch {
      showError('Raden kunde inte raderas.');
    }
  };

  return {
    formState,
    setFormState,
    setCellRef,
    handleKeyDown,
    handleBlur,
    onManualSave,
    onDelete,
  };
};
