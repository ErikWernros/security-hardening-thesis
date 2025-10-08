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
import { type Omrade } from '@/types/domainTypes';
import { useOmradeController } from '@/controllers/navigationtree/useOmradeController';

type OmradeFormMode = 'create' | 'edit';

export interface OmradeFormProps {
  mode: OmradeFormMode;
  /** Requerido en modo create */
  parentAvsnittId?: number;
  /** Requerido en modo edit */
  initialOmrade?: Omrade;
  onClose?: () => void;
  /** Se dispara al crear correctamente (para expand/seleccionar) */
  onCreated?: (created: Omrade) => void;
}

export const OmradeForm: React.FC<OmradeFormProps> = ({
  mode,
  parentAvsnittId,
  initialOmrade,
  onClose,
  onCreated,
}) => {
  const isEdit = mode === 'edit';
  const [kod, setKod] = React.useState<string>(initialOmrade?.kod ?? '');
  const [namn, setNamn] = React.useState<string>(initialOmrade?.namn ?? '');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { createOmrade, updateOmrade, deleteOmrade, isBusy } = useOmradeController();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && initialOmrade) {
      await updateOmrade({ id: initialOmrade.id, kod: kod.trim(), namn: namn.trim() });
      onClose?.();
      return;
    }

    if (!parentAvsnittId) return;
    const created = await createOmrade({
      avsnittId: parentAvsnittId,
      kod: kod.trim(),
      namn: namn.trim(),
    });
    if (created) onCreated?.(created);
    onClose?.();
  };

  const handleDelete = async () => {
    if (!isEdit || !initialOmrade) return;
    await deleteOmrade(initialOmrade.id);
    setConfirmOpen(false);
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='omr-kod'>Kod</Label>
          <Input id='omr-kod' value={kod} onChange={(e) => setKod(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='omr-namn'>Namn</Label>
          <Input id='omr-namn' value={namn} onChange={(e) => setNamn(e.target.value)} required />
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
            Radera område
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera område?</AlertDialogTitle>
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
