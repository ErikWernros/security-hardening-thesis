// src/components/navigationtree/StyckeForm.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { type Stycke } from '@/types/domainTypes';
import { useStyckeController } from '@/controllers/navigationtree/useStyckeController';

type StyckeFormMode = 'create' | 'edit';

export interface StyckeFormProps {
  mode: StyckeFormMode;
  /** Requerido en modo create */
  parentOmradeId?: number;
  /** Requerido en modo edit */
  initialStycke?: Stycke;
  onClose?: () => void;
  /** Se dispara al crear correctamente (para expand/seleccionar) */
  onCreated?: (created: Stycke) => void;
}

export const StyckeForm: React.FC<StyckeFormProps> = ({
  mode,
  parentOmradeId,
  initialStycke,
  onClose,
  onCreated,
}) => {
  const isEdit = mode === 'edit';

  const [kod, setKod] = React.useState<string>(initialStycke?.kod ?? '');
  const [namn, setNamn] = React.useState<string>(initialStycke?.namn ?? '');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { createStycke, updateStycke, deleteStycke, isBusy } = useStyckeController();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && initialStycke) {
      await updateStycke({ id: initialStycke.id, kod: kod.trim(), namn: namn.trim() });
      onClose?.();
      return;
    }

    if (!parentOmradeId) return;
    const created = await createStycke({
      omradeId: parentOmradeId,
      kod: kod.trim(),
      namn: namn.trim(),
    });
    if (created) onCreated?.(created);
    onClose?.();
  };

  const handleDelete = async () => {
    if (!isEdit || !initialStycke) return;
    await deleteStycke(initialStycke.id);
    setConfirmOpen(false);
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='sty-kod'>Kod</Label>
          <Input id='sty-kod' value={kod} onChange={(e) => setKod(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='sty-namn'>Namn</Label>
          <Input id='sty-namn' value={namn} onChange={(e) => setNamn(e.target.value)} required />
        </div>
      </div>

      <div className='flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2'>
        <div className='flex gap-2'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Avbryt
          </Button>
          <Button type='submit' disabled={isBusy}>
            {isEdit ? 'Spara ändringar' : 'Skapa'}
          </Button>
        </div>

        {isEdit ? (
          <Button
            type='button'
            variant='destructive'
            onClick={() => setConfirmOpen(true)}
            disabled={isBusy}
          >
            Radera stycke
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera stycke?</AlertDialogTitle>
            <AlertDialogDescription>Detta kan inte ångras.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Radera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};
