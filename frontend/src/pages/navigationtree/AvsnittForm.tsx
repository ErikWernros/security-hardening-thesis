// src/components/navigationtree/AvsnittForm.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { type Avsnitt } from '@/types/domainTypes';
import { useAvsnittController } from '@/controllers/navigationtree/useAvsnittController';

type AvsnittFormMode = 'create' | 'edit';

export interface AvsnittFormProps {
  mode: AvsnittFormMode;
  /** Requerido en modo create */
  parentDelId?: number;
  /** Requerido en modo edit */
  initialAvsnitt?: Avsnitt;
  onClose?: () => void;
  /** 👉 NUEVO: notifica el Avsnitt creado */
  onCreated?: (created: Avsnitt) => void;
}

export const AvsnittForm: React.FC<AvsnittFormProps> = ({
  mode,
  parentDelId,
  initialAvsnitt,
  onClose,
  onCreated, // ✅ ahora existe en las props
}) => {
  const isEdit = mode === 'edit';
  const [kod, setKod] = React.useState<string>(initialAvsnitt?.kod ?? '');
  const [namn, setNamn] = React.useState<string>(initialAvsnitt?.namn ?? '');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const { createAvsnitt, updateAvsnitt, deleteAvsnitt, isBusy } = useAvsnittController();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && initialAvsnitt) {
      await updateAvsnitt({ id: initialAvsnitt.id, kod: kod.trim(), namn: namn.trim() });
      onClose?.();
      return;
    }
    if (!parentDelId) return;
    const created = await createAvsnitt({
      delId: parentDelId,
      kod: kod.trim(),
      namn: namn.trim(),
    });
    if (created) onCreated?.(created); // ✅ notifica al padre
    onClose?.();
  };

  const handleDelete = async () => {
    if (!isEdit || !initialAvsnitt) return;
    await deleteAvsnitt(initialAvsnitt.id);
    setConfirmOpen(false);
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='avs-kod'>Kod</Label>
          <Input id='avs-kod' value={kod} onChange={(e) => setKod(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='avs-namn'>Namn</Label>
          <Input id='avs-namn' value={namn} onChange={(e) => setNamn(e.target.value)} required />
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
            Radera
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera avsnitt?</AlertDialogTitle>
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
