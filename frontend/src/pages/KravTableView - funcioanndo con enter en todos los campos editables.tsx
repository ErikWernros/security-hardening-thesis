import { useState, useRef, useEffect } from 'react';
import { useKravList, useKravUpdate } from '@/hooks/useKrav';
import { useSvarSave } from '@/hooks/useSvar';
import { type Krav } from '@/types/domainTypes';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
    <div className='space-y-4'>
      <div className='grid grid-cols-7 gap-4 px-4 py-2 font-semibold text-sm border-b'>
        <span>Kod</span>
        <span>Krav</span>
        <span>Anvisning</span>
        <span>Betyg</span>
        <span>Ja / Nej</span>
        <span>Verifikat</span>
        <span>Kommentar</span>
      </div>
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
    <div className='grid grid-cols-7 gap-4 items-center px-4 py-2 border-b'>
      <span className='text-sm'>{krav.kod}</span>

      {/* kravText */}
      <Input
        ref={setCellRef(0)}
        value={formState.kravText}
        onChange={(e) => setFormState((s) => ({ ...s, kravText: e.target.value }))}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 0)}
        placeholder='Krav'
      />

      {/* anvisning */}
      <Input
        ref={setCellRef(1)}
        value={formState.anvisning}
        onChange={(e) => setFormState((s) => ({ ...s, anvisning: e.target.value }))}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 1)}
        placeholder='Anvisning'
      />

      {/* betyg (0-5) */}
      <Select
        defaultValue={formState.betyg?.toString()}
        onValueChange={(val) => setFormState((s) => ({ ...s, betyg: parseInt(val, 10) }))}
      >
        <SelectTrigger
          ref={setCellRef(2)}
          onBlur={handleBlur}
          onKeyDown={(e) => handleKeyDown(e, 2)}
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

      {/* jaNej */}
      <Switch
        ref={setCellRef(3) as unknown as React.Ref<HTMLButtonElement>}
        checked={formState.jaNej}
        onCheckedChange={(val) => setFormState((s) => ({ ...s, jaNej: val }))}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 3)}
      />

      {/* verifikat */}
      <Input
        ref={setCellRef(4)}
        value={formState.verifikat}
        onChange={(e) => setFormState((s) => ({ ...s, verifikat: e.target.value }))}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 4)}
        placeholder='Verifikat'
      />

      {/* comentario */}
      <Input
        ref={setCellRef(5)}
        value={formState.kommentar}
        onChange={(e) => setFormState((s) => ({ ...s, kommentar: e.target.value }))}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 5)}
        placeholder='Comentario'
      />
    </div>
  );
};
