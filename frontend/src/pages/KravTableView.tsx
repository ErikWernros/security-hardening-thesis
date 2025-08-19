// src/components/KravTableView.tsx
import { useState, useRef, useEffect } from 'react';
import { useKravList, useKravUpdate } from '@/hooks/useKrav';
import { useSvarSave } from '@/hooks/useSvar';
import { type Krav } from '@/types/domainTypes';
//import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AmplifiedInput } from '@/components/inputs/AmplifiedInput';

type CellRef = HTMLInputElement | HTMLButtonElement | null;

export const KravTableView = ({ styckeId }: { styckeId: number }) => {
  const { data: kravList = [] } = useKravList(styckeId);
  const inputRefs = useRef<Array<Array<CellRef>>>([]);

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
      {/* Sticky header for md+ screens (kept) */}
      <div
        className='
          hidden md:grid grid-cols-7 gap-4 px-4 py-3 
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

      <div className='space-y-3 md:space-y-0'>
        {kravList.map((krav, rowIndex) => (
          <KravRowEditable
            key={krav.id}
            krav={krav}
            rowIndex={rowIndex}
            inputRefs={inputRefs}
            onEnterNext={focusNext}
          />
        ))}
      </div>
    </>
  );
};

const KravRowEditable = ({
  krav,
  rowIndex,
  inputRefs,
  onEnterNext,
}: {
  krav: Krav;
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
    betyg:
      krav.svar?.betyg !== null && krav.svar?.betyg !== undefined ? krav.svar.betyg.toString() : '',
    jaNej: krav.svar?.jaNej ?? false,
    verifikat: krav.svar?.verifikat ?? '',
    kommentar: krav.svar?.kommentar ?? '',
  });

  const saveSvar = useSvarSave(krav.id);
  const updateKrav = useKravUpdate(krav.id);

  const handleBlur = () => {
    // Convert 'betyg' to number or null safely
    const betygValue =
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
    if (!inputRefs.current[rowIndex]) inputRefs.current[rowIndex] = [] as Array<CellRef>;
    inputRefs.current[rowIndex][col] = el ?? null;
  };

  const handleKeyDown = (e: React.KeyboardEvent, col: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      onEnterNext(rowIndex, col);
    }
  };

  return (
    <div
      className='
        grid grid-cols-1 md:grid-cols-7 gap-3 md:gap-4 items-start md:items-center 
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
            className='h-11 md:h-9 text-sm'
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
      <div className='flex flex-col gap-1'>
        <span className='md:hidden text-[11px] font-medium text-muted-foreground uppercase tracking-wide'>
          Ja / Nej
        </span>
        <Switch
          ref={setCellRef(3) as unknown as React.Ref<HTMLButtonElement>}
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
          className='h-11 md:h-9 text-sm'
        />
      </div>

      {/* kommentar */}
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
    </div>
  );
};
