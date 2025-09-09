// src/components/KravTableView.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useKravList, useKravUpdate } from '@/hooks/useKrav';
import { useSvarSave, useSvarIndicatorByStycke, type SvarWithKrav } from '@/hooks/useSvar';
import { type Krav, type Svar } from '@/types/domainTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AmplifiedInput } from '@/components/inputs/AmplifiedInput';

// 🔹 Auxiliary actions and hooks
import { Button } from '@/components/ui/button';
import { PlusCircle, Save, Trash2, XCircle, SquareCheckBig } from 'lucide-react';
import axios, { type AxiosError } from 'axios';
import { useKravCreate, useKravDelete } from '@/hooks/useKravMutations';
import { useBrind } from '@/components/toast/useBrindToast';

type CellRef = HTMLInputElement | HTMLButtonElement | null;

export const KravTableView = ({ styckeId }: { styckeId: number }) => {
  const { data: kravList = [] } = useKravList(styckeId);

  // ✅ NUEVO: obtener respuestas (svar) por stycke
  const { data: svarList = [] } = useSvarIndicatorByStycke(styckeId);

  // ✅ NUEVO: mapear por kravId para hidratar cada fila rápidamente
  const svarMap = useMemo(() => {
    const map = new Map<number, SvarWithKrav>();
    for (const s of svarList) map.set(s.kravId, s);
    return map;
  }, [svarList]);

  const inputRefs = useRef<Array<Array<CellRef>>>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { showWarning } = useBrind();

  useEffect(() => {
    // Initialize matrix of refs: 6 editable columns per row
    inputRefs.current = kravList.map(() => new Array<CellRef>(6).fill(null));
  }, [kravList]);

  const focusNext = (row: number, col: number) => {
    // Move to next column; if it's the last column, jump to first editable
    let nextRow = row;
    let nextCol = col + 1;

    if (nextCol >= 6) {
      // We reached the end of the row, try to go to next row col 0
      nextCol = 0;
      nextRow++;
    }

    // If next row exists, focus it; otherwise loop back to first col of current row
    if (nextRow < inputRefs.current.length) {
      const el = inputRefs.current[nextRow]?.[nextCol];
      if (el) {
        setTimeout(() => (el as HTMLElement).focus(), 0);
      }
    } else {
      // No new line found → return to first editable column of the same row
      const fallback = inputRefs.current[row]?.[0];
      if (fallback) {
        setTimeout(() => (fallback as HTMLElement).focus(), 0);
      }
    }
  };

  return (
    <>
      {/* 🔹 Barra de acciones arriba sin tocar el header sticky */}
      <div className='flex justify-end px-4 py-2 md:py-3'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            if (isCreating) {
              showWarning('Du skapar redan en rad.');
              return;
            }
            setIsCreating(true);
          }}
          className='gap-2 transition-colors bg-primary text-primary-foreground border-primary md:bg-transparent md:text-foreground md:hover:bg-primary md:hover:text-primary-foreground'
          title='Ny rad'
        >
          <PlusCircle className='h-4 w-4 md:mr-1' />
          <span className='inline'>Ny rad</span>
        </Button>
      </div>

      {/* Sticky header for md+ screens (kept) */}
      <div
        className='
          hidden md:grid grid-cols-8 gap-4 px-4 py-3 
          font-semibold text-sm border-b
          sticky top-0 z-10 bg-background/90 backdrop-blur
        '
      >
        <span>Kod</span>
        <span>Krav</span>
        <span>Anvisning</span>
        <span>Betyg</span>
        <span>Ja / Nej</span>
        <span>Verifikat</span>
        <span>Kommentar</span>
      </div>

      {/* 🔹 Create row (inline) without modifying the existing layout */}
      {isCreating && (
        <KravNewRowInline
          styckeId={styckeId}
          onCancel={() => setIsCreating(false)}
          onSaved={() => setIsCreating(false)}
        />
      )}

      <div className='space-y-3 md:space-y-0'>
        {kravList.map((krav, rowIndex) => (
          <KravRowEditable
            key={krav.id}
            krav={krav}
            // ✅ NUEVO: pasar el svar hidratado si existe (sin kravId)
            svar={svarMap.get(krav.id) as Svar | undefined}
            rowIndex={rowIndex}
            inputRefs={inputRefs}
            onEnterNext={focusNext}
          />
        ))}
      </div>
    </>
  );
};

/* ---------------------------------------------
 * NewRow inline – respects the grid and styles
 * ---------------------------------------------
 * - Keeps 7 columns (no layout break).
 * - Buttons aligned left, wrap on small screens.
 * - Removes the three '—' placeholders.
 */
type BackendError = { code?: string; field?: string; message?: string };

const KravNewRowInline = ({
  styckeId,
  onCancel,
  onSaved,
}: {
  styckeId: number;
  onCancel: () => void;
  onSaved?: () => void;
}) => {
  const [kod, setKod] = useState<string>('');
  const [kravText, setKravText] = useState<string>('');
  const [anvisning, setAnvisning] = useState<string>('');

  // refs para navegación con Enter (mismo orden visual)
  type CellRef = HTMLElement | null;
  const inputRefs = useRef<CellRef[]>([null, null, null]);
  const setCellRef = (col: number) => (el: HTMLElement | null) => {
    inputRefs.current[col] = el;
  };

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
    // Si es el último (Anvisning) -> guardar como Spara
    if (col === inputRefs.current.length - 1) {
      void onSave();
    } else {
      focusNext(col);
    }
  };

  const kodRef = useRef<HTMLInputElement | null>(null);
  const create = useKravCreate(styckeId);
  const { showError, showSuccess, showWarning } = useBrind();

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

  return (
    <div
      className='
        grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4 items-start md:items-center 
        px-3 md:px-4 py-3 border-b last:border-b-0
        transition-colors hover:bg-muted/40 md:hover:bg-transparent
      '
    >
      {/* Kod */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Kod
        </span>
        <AmplifiedInput
          ref={(el) => {
            kodRef.current = el as HTMLInputElement | null;
            setCellRef(0)(el as HTMLElement | null);
          }}
          value={kod}
          onChange={(e) => setKod(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          placeholder='Kod'
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* Krav */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Krav
        </span>
        <AmplifiedInput
          ref={setCellRef(1)}
          value={kravText}
          onChange={(e) => setKravText(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          placeholder='Krav'
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* Anvisning */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Anvisning
        </span>
        <AmplifiedInput
          ref={setCellRef(2)}
          value={anvisning}
          onChange={(e) => setAnvisning(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          placeholder='Anvisning'
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* Desktop / Movil */}
      <div className='flex items-center gap-2 justify-start'>
        <Button
          type='button'
          onClick={onSave}
          disabled={create.isPending}
          className='h-9 px-2 md:px-3'
          title='Spara'
        >
          <Save className='h-4 w-4' />
          {/* className='ml-2 hidden  md:inline = Remove the Spara / Avbryt text*/}
          <span className='ml-2 md:inline'>Spara</span>
        </Button>
        <Button
          type='button'
          variant='ghost'
          onClick={onCancelClick}
          className='h-9 px-2 md:px-3 hover:bg-destructive/10 hover:text-destructive'
          title='Avbryt'
        >
          <XCircle className='h-4 w-4' />
          <span className='ml-2 md:inline'>Avbryt</span>
        </Button>
      </div>
    </div>
  );
};

const KravRowEditable = ({
  krav,
  svar, // ✅ NUEVO: datos hidratados (sin kravId) si existen
  rowIndex,
  inputRefs,
  onEnterNext,
}: {
  krav: Krav;
  svar?: Svar;
  rowIndex: number;
  inputRefs: React.RefObject<Array<Array<CellRef>>>;
  onEnterNext: (row: number, col: number) => void;
}) => {
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
    // Preferir svar hidratado si existe, manteniendo tu fallback actual
    betyg:
      (svar?.betyg ?? krav.svar?.betyg) !== null && (svar?.betyg ?? krav.svar?.betyg) !== undefined
        ? String(svar?.betyg ?? krav.svar?.betyg)
        : '',
    jaNej: svar?.jaNej ?? krav.svar?.jaNej ?? false,
    verifikat: svar?.verifikat ?? krav.svar?.verifikat ?? '',
    kommentar: svar?.kommentar ?? krav.svar?.kommentar ?? '',
  });

  // ✅ NUEVO: rehidratar cuando cambie el svar (llega asíncrono del hook)
  useEffect(() => {
    if (!svar) return;
    setFormState((prev) => ({
      ...prev,
      betyg: svar.betyg !== null && svar.betyg !== undefined ? String(svar.betyg) : '',
      jaNej: svar.jaNej ?? false,
      verifikat: svar.verifikat ?? '',
      kommentar: svar.kommentar ?? '',
    }));
  }, [svar?.betyg, svar?.jaNej, svar?.verifikat, svar?.kommentar]);

  const saveSvar = useSvarSave(krav.id);
  const updateKrav = useKravUpdate(krav.id);

  const handleBlur = () => {
    // Convert 'betyg' to number or null safely
    const betygValue: number | null =
      typeof formState.betyg === 'string'
        ? Number.isFinite(Number(formState.betyg))
          ? Number(formState.betyg)
          : null
        : formState.betyg;

    // Persist Svar
    saveSvar.mutate({
      betyg: betygValue,
      jaNej: formState.jaNej,
      verifikat: formState.verifikat,
      kommentar: formState.kommentar,
    });

    // Persist Krav text fields
    updateKrav.mutate({
      kravText: formState.kravText,
      anvisning: formState.anvisning,
    });
  };

  const setCellRef = (col: number) => (el: CellRef) => {
    // Store ref for current row/col
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

  const { showSuccess, showError } = useBrind();
  const del = useKravDelete(); // We can pass styckeId in the hook if your impl needs it.

  // ✅ Manual save via icon with toast feedback
  const onManualSave = async () => {
    try {
      // Convert consistently like handleBlur (no behavior change)
      const betygValue: number | null =
        typeof formState.betyg === 'string'
          ? Number.isFinite(Number(formState.betyg))
            ? Number(formState.betyg)
            : null
          : formState.betyg;

      // Persist both entities and wait to show correct feedback
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

      // Success toast
      showSuccess('Ändringar sparade.');
    } catch {
      // Error toast
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

  return (
    <div
      className='
        grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4 items-start md:items-center 
        px-3 md:px-4 py-3 border-b last:border-b-0
        transition-colors hover:bg-muted/40 md:hover:bg-transparent
      '
    >
      {/* Kod */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Kod
        </span>
        <span className='text-sm'>{krav.kod}</span>
      </div>

      {/* kravText */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Krav
        </span>
        <AmplifiedInput
          ref={setCellRef(0)}
          value={formState.kravText}
          onChange={(e) => setFormState((s) => ({ ...s, kravText: e.target.value }))}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          placeholder='Krav'
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* anvisning */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Anvisning
        </span>
        <AmplifiedInput
          ref={setCellRef(1)}
          value={formState.anvisning}
          onChange={(e) => setFormState((s) => ({ ...s, anvisning: e.target.value }))}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          placeholder='Anvisning'
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* betyg (0-5) */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Betyg
        </span>
        <Select
          defaultValue={formState.betyg?.toString()}
          onValueChange={(val) => setFormState((s) => ({ ...s, betyg: parseInt(val, 10) }))}
        >
          <SelectTrigger
            ref={setCellRef(2)}
            onBlur={handleBlur}
            onKeyDown={(e) => handleKeyDown(e, 2)}
            className='h-11 md:h-9 text-sm text-left justify-start'
          >
            <SelectValue placeholder='Betyg' />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* jaNej */}
      <div className='flex flex-col gap-1 w-14'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Ja / Nej
        </span>
        <Switch
          ref={setCellRef(3) as React.Ref<HTMLButtonElement>}
          checked={formState.jaNej}
          onCheckedChange={(val) => setFormState((s) => ({ ...s, jaNej: val }))}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, 3)}
          className='data-[state=checked]:ring-1 data-[state=checked]:ring-primary'
        />
      </div>

      {/* verifikat */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Verifikat
        </span>
        <AmplifiedInput
          ref={setCellRef(4)}
          value={formState.verifikat}
          onChange={(e) => setFormState((s) => ({ ...s, verifikat: e.target.value }))}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, 4)}
          placeholder='Verifikat'
          className='h-11 md:h-9 text-sm' // 👈 important for it to grow well
        />
      </div>

      {/* kommentar + acciones (save + delete) */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Kommentar
        </span>

        <AmplifiedInput
          ref={setCellRef(5)}
          value={formState.kommentar}
          onChange={(e) => setFormState((s) => ({ ...s, kommentar: e.target.value }))}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, 5)}
          placeholder='Kommentar'
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* ✅ Actions: text on mobile, icons on desktop */}
      <div className='flex flex-col gap-1'>
        {/* 📱 Mobile: buttons with text (Save / Delete) */}
        <div className='flex gap-2 md:hidden'>
          {/* Save button on mobile */}
          <Button
            type='button'
            onClick={onManualSave}
            className='h-10 px-3'
            title='Spara'
            aria-label='Spara'
          >
            {/* Comment: Text label for better tap targets on mobile */}
            Spara
          </Button>

          {/* Delete button on mobile */}
          <Button
            type='button'
            variant='destructive'
            onClick={onDelete}
            className='h-10 px-3'
            title='Radera'
            aria-label='Radera'
          >
            {/* Comment: Text label for clearer action on mobile */}
            Radera
          </Button>
        </div>

        {/* 🖥️ Desktop: icon-only (se mantiene igual que ahora) */}
        <div className='hidden md:flex gap-1'>
          {/* Save icon button (desktop) */}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={onManualSave}
            className='h-9 w-9 hover:bg-emerald-100 hover:text-emerald-700'
            title='Spara'
            aria-label='Save row'
          >
            <SquareCheckBig className='h-4 w-4' />
          </Button>

          {/* Delete icon button (desktop) */}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={onDelete}
            className='h-9 w-9 hover:bg-rose-100 hover:text-rose-700'
            title='Radera'
            aria-label='Delete row'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};
