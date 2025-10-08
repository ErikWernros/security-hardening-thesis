// src/components/navigationtree/DelForm.tsx
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
import { type Del } from '@/types/domainTypes';
import { useDelController } from '@/controllers/navigationtree/useDelController';

type DelFormMode = 'create' | 'edit';

interface DelFormProps {
  mode: DelFormMode;
  initialDel?: Del;
  onClose?: () => void;
}

export const DelForm: React.FC<DelFormProps> = ({ mode, initialDel, onClose }) => {
  const isEdit = mode === 'edit';
  const [kod, setKod] = React.useState<string>(initialDel?.kod ?? '');
  const [namn, setNamn] = React.useState<string>(initialDel?.namn ?? '');
  const [openConfirm, setOpenConfirm] = React.useState(false);

  const { createDel, updateDel, deleteDel, isBusy } = useDelController();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && initialDel) {
      await updateDel({ id: initialDel.id, kod: kod.trim(), namn: namn.trim() });
    } else {
      await createDel({ kod: kod.trim(), namn: namn.trim() });
    }
    onClose?.();
  };

  const onDelete = async () => {
    if (!isEdit || !initialDel) return;
    await deleteDel(initialDel.id);
    setOpenConfirm(false);
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* layout responsive: 1 col (sm), 2 cols (md+) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='del-kod'>Kod</Label>
          <Input
            id='del-kod'
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            placeholder='t.ex. D1'
            required
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='del-namn'>Namn</Label>
          <Input
            id='del-namn'
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            placeholder='t.ex. Ledningssystem'
            required
          />
        </div>
      </div>

      <div className='flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:justify-between'>
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
            onClick={() => setOpenConfirm(true)}
            className='self-start sm:self-auto'
          >
            Radera
          </Button>
        ) : null}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera DEL?</AlertDialogTitle>
            <AlertDialogDescription>
              Den här åtgärden kan inte ångras. Är du säker på att du vill radera denna del?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Radera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};
