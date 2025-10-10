// src/pages/krav/KravTableView.tsx
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
import { Button } from '@/components/ui/button';
import { PlusCircle, Save, Trash2, XCircle, SquareCheckBig } from 'lucide-react';
import { useMemo } from 'react';

import { useKravTableView } from '@/controllers/krav/useKravTableView';
import { useKravNewRow } from '@/controllers/krav/useKravNewRow';
import { useKravRow } from '@/controllers/krav/useKravRow';

import type { KravListFilter } from '@/hooks/useKrav';

type CellRef = HTMLInputElement | HTMLButtonElement | null;
type Props = { styckeId: number } | { scope?: KravListFilter };

// Campos de scope válidos
type ScopeKey = 'styckeId' | 'avsnittId' | 'omradeId';

export const KravTableView = (props: Props) => {
  // 🔒 Memo del filtro efectivo (evita nuevas referencias para la queryKey)
  const effectiveFilter: KravListFilter = useMemo(() => {
    return 'scope' in props && props.scope != null
      ? props.scope
      : { styckeId: (props as { styckeId: number }).styckeId };
  }, [props]);

  const { kravList, svarMap, inputRefs, isCreating, setIsCreating, focusNext, onClickNewRow } =
    useKravTableView(effectiveFilter);

  // ───────────────────────────────────────────────────────────
  // Detección de scope actual
  // ───────────────────────────────────────────────────────────
  const scopeKey: ScopeKey | null = useMemo(() => {
    if (typeof effectiveFilter.styckeId === 'number') return 'styckeId';
    if (typeof effectiveFilter.avsnittId === 'number') return 'avsnittId';
    if (typeof effectiveFilter.omradeId === 'number') return 'omradeId';
    return null;
  }, [effectiveFilter]);

  const scopeValue: number | undefined =
    scopeKey != null ? (effectiveFilter as Record<string, number>)[scopeKey] : undefined;

  // ✅ Ahora se permite crear en cualquier scope válido (stycke/avsnitt/omrade),
  //    independientemente de si existen "kravs directos" actualmente.
  const canCreate = Boolean(scopeKey && scopeValue != null);

  return (
    <>
      {/* Action Bar (solo visible en mobile en tu layout actual) */}
      <div className='flex justify-end px-4 py-2 md:py-3 md:hidden'>
        <Button
          type='button'
          variant='outline'
          onClick={() => canCreate && onClickNewRow()}
          disabled={!canCreate}
          className='gap-2 transition-colors bg-primary text-primary-foreground border-primary md:bg-transparent md:text-foreground md:hover:bg-primary md:hover:text-primary-foreground disabled:opacity-50'
          title='Ny rad'
        >
          <PlusCircle className='h-4 w-4 md:mr-1' />
          <span className='inline'>Ny rad</span>
        </Button>
      </div>

      {/* Header */}
      <div className='hidden md:grid grid-cols-8 gap-4 px-4 py-3 font-semibold text-sm border-b sticky top-0 z-10 bg-background/90 backdrop-blur'>
        <span>Kod</span>
        <span>Krav</span>
        <span>Anvisning</span>
        <span>Betyg</span>
        <span>Ja / Nej</span>
        <span>Verifikat</span>
        <span>Kommentar</span>
        <div className='flex justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => canCreate && onClickNewRow()}
            disabled={!canCreate}
            className='gap-2 transition-colors md:bg-transparent md:text-foreground md:hover:bg-primary md:hover:text-primary-foreground disabled:opacity-50'
            title='Ny rad'
          >
            <PlusCircle className='h-4 w-4' />
            <span className='inline'>Ny rad</span>
          </Button>
        </div>
      </div>

      {/* Nueva fila */}
      {isCreating && canCreate && scopeKey && scopeValue != null && (
        <KravNewRowInline
          scope={{ [scopeKey]: scopeValue } as KravListFilter}
          onCancel={() => setIsCreating(false)}
          onSaved={() => setIsCreating(false)}
        />
      )}

      {/* Filas */}
      <div className='space-y-3 md:space-y-0'>
        {kravList.map((krav, rowIndex) => (
          <KravRowEditable
            key={krav.id}
            krav={krav}
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

const KravNewRowInline = ({
  scope,
  onCancel,
  onSaved,
}: {
  scope: KravListFilter;
  onCancel: () => void;
  onSaved?: () => void;
}) => {
  const {
    kod,
    setKod,
    kravText,
    setKravText,
    anvisning,
    setAnvisning,
    kodRef,
    setCellRef,
    handleKeyDown,
    onSave,
    onCancelClick,
    create,
  } = useKravNewRow(scope, onCancel, onSaved);

  return (
    <div className='grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4 items-start md:items-center px-3 md:px-4 py-1 border-b last:border-b-0 transition-colors hover:bg-muted/40 md:hover:bg-transparent'>
      {/* Kod */}
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Kod
        </span>
        <AmplifiedInput
          ref={(el) => {
            (kodRef.current as HTMLInputElement | null) = el as HTMLInputElement | null;
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
          hoverDelayMs={1000}
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
          hoverDelayMs={1000}
        />
      </div>

      {/* Acciones */}
      <div className='flex items-center gap-2 justify-start'>
        <Button
          type='button'
          onClick={onSave}
          disabled={create.isPending}
          className='h-9 px-2 md:px-3'
          title='Spara'
        >
          <Save className='h-4 w-4' />
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
  svar,
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
  const { formState, setFormState, setCellRef, handleKeyDown, handleBlur, onManualSave, onDelete } =
    useKravRow(krav, svar, rowIndex, inputRefs, onEnterNext);

  return (
    <div className='grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4 items-start md:items-center px-3 md:px-4 py-1 border-b last:border-b-0 transition-colors hover:bg-muted/40 md:hover:bg-transparent'>
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
          className='h-11 md:h-9 text-sm whitespace-nowrap overflow-hidden text-ellipsis truncate resize-none'
          hoverDelayMs={1000}
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
          className='h-11 md:h-9 text-sm whitespace-nowrap overflow-hidden text-ellipsis truncate resize-none'
          hoverDelayMs={1000}
        />
      </div>

      {/* betyg */}
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

      {/* Ja / Nej */}
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

      {/* Verifikat */}
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
          className='h-11 md:h-9 text-sm whitespace-nowrap overflow-hidden text-ellipsis truncate resize-none'
          hoverDelayMs={1000}
        />
      </div>

      {/* Kommentar + acciones */}
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
          className='h-11 md:h-9 text-sm whitespace-nowrap overflow-hidden text-ellipsis truncate resize-none'
          hoverDelayMs={1000}
        />
      </div>

      {/* Actions */}
      <div className='flex flex-col gap-1'>
        <div className='flex gap-2 md:hidden'>
          <Button
            type='button'
            onClick={onManualSave}
            className='h-10 px-3'
            title='Spara'
            aria-label='Spara'
          >
            Spara
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={onDelete}
            className='h-10 px-3'
            title='Radera'
            aria-label='Radera'
          >
            Radera
          </Button>
        </div>
        <div className='hidden md:flex gap-1'>
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
