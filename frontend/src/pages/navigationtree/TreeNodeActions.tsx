// src/components/krav/TreeNodeActions.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Pencil, Trash2 } from 'lucide-react';

type Level = 'del' | 'avsnitt' | 'omrade' | 'stycke';

export type TreeNodeActionsProps = {
  level: Level;
  id: number;
  onCreate?: (level: Level, id: number) => void;
  onEdit?: (level: Level, id: number) => void;
  onDelete?: (level: Level, id: number) => void;
  disabledCreate?: boolean;
  disabledEdit?: boolean;
  disabledDelete?: boolean;
  className?: string;
};

export const TreeNodeActions: React.FC<TreeNodeActionsProps> = ({
  level,
  id,
  onCreate,
  onEdit,
  onDelete,
  disabledCreate,
  disabledEdit,
  disabledDelete,
  className,
}) => {
  const isStycke = level === 'stycke';

  const handleCreate = () => onCreate?.(level, id);
  const handleEdit = () => onEdit?.(level, id);
  const handleDelete = () => onDelete?.(level, id);

  return (
    <div className={className ?? ''}>
      {/* Desktop: caja negra compacta con scrim (no bloquea hover) */}
      <div
        className='
          hidden md:flex
          absolute right-1.5 top-1/2 -translate-y-1/2
          opacity-0 group-hover:opacity-100 transition-opacity
          z-20 pointer-events-none
        '
        aria-label='Node actions'
      >
        {/* Scrim */}
        <span
          aria-hidden='true'
          className='
            absolute right-full mr-1
            h-7 w-10
            bg-gradient-to-l from-black/60 to-transparent
            rounded-l-md
            pointer-events-none z-0
          '
        />
        {/* Caja */}
        <div
          className='
            relative z-10 pointer-events-auto
            flex items-center gap-0.5
            bg-black/95 text-white
            rounded-lg ring-1 ring-white/15 drop-shadow-xl
            px-1.5 py-0.5
          '
        >
          {/* Skapa: oculto en nivel stycke */}
          {!isStycke && (
            <Button
              type='button'
              size='icon'
              variant='ghost'
              onClick={handleCreate}
              disabled={disabledCreate}
              title='Skapa'
              aria-label='New'
              className='
                text-white hover:bg-white/20 h-7 w-7
                focus-visible:ring-2 focus-visible:ring-white/30
                transition
              '
            >
              <Plus className='h-3.5 w-3.5 transition-transform group-hover:scale-110' />
            </Button>
          )}

          <Button
            type='button'
            size='icon'
            variant='ghost'
            onClick={handleEdit}
            disabled={disabledEdit}
            title='Regidera'
            aria-label='Edit'
            className='
              text-white hover:bg-white/20 h-7 w-7
              focus-visible:ring-2 focus-visible:ring-white/30
              transition
            '
          >
            <Pencil className='h-3.5 w-3.5 transition-transform group-hover:scale-110' />
          </Button>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            onClick={handleDelete}
            disabled={disabledDelete}
            title='Radera'
            aria-label='Delete'
            className='
              text-white hover:bg-white/20 h-7 w-7
              focus-visible:ring-2 focus-visible:ring-white/30
              transition
            '
          >
            <Trash2 className='h-3.5 w-3.5 transition-transform group-hover:scale-110' />
          </Button>
        </div>
      </div>

      {/* Mobile: kebab con menú */}
      <div className='md:hidden'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type='button' variant='ghost' size='icon' aria-label='Más acciones'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-40'>
            {/* Skapa: oculto en nivel stycke */}
            {!isStycke && (
              <DropdownMenuItem onClick={handleCreate} disabled={disabledCreate} className='gap-2'>
                <Plus className='h-4 w-4' />
                Skapa
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleEdit} disabled={disabledEdit} className='gap-2'>
              <Pencil className='h-4 w-4' />
              Regidera
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={disabledDelete}
              className='gap-2 text-rose-600 focus:text-rose-600'
            >
              <Trash2 className='h-4 w-4' />
              Radera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
