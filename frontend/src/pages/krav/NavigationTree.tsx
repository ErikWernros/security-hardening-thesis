// src/components/krav/NavigationTree.tsx
import {
  type Del,
  type Avsnitt as AvsnittType,
  type Omrade as OmradeType,
  type Stycke as StyckeType,
} from '@/types/domainTypes';

import { useAvsnittList } from '@/hooks/useAvsnitt';
import { useOmradeList } from '@/hooks/useOmrade';
import { useStyckeList } from '@/hooks/useStycke';
import {
  useSvarIndicatorByStycke,
  useSvarIndicatorByAvsnitt,
  useSvarIndicatorByOmrade,
} from '@/hooks/useSvar';
import { useKravList, kravListKey, fetchKravList } from '@/hooks/useKrav';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useSortedArray } from '@/hooks/useSortedArray';
import type { KravListFilter } from '@/hooks/useKrav';
import { useQueryClient } from '@tanstack/react-query';
import { TreeNodeActions } from '../navigationtree/TreeNodeActions';

// Dialogs + Forms
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DelForm } from '../navigationtree/DelForm';
import { AvsnittForm } from '../navigationtree/AvsnittForm';
import { OmradeForm } from '../navigationtree/OmradeForm';
import { StyckeForm } from '../navigationtree/StyckeForm';

interface Props {
  delList: Del[];
  selectedStyckeId: number | null;
  /** Scope actual para resaltar Avsnitt/Område seleccionados */
  selectedScope?: KravListFilter | null;
  onSelectStycke: (id: number) => void;
  expandedDelId: number | null;
  expandedAvsnittId: number | null;
  onExpandDel: (delId: number) => void;
  onExpandAvsnitt: (avsnittId: number) => void;
  expandedOmradeId?: number | null;
  onExpandOmrade?: (omradeId: number) => void;
  /** Avisar al padre que se quiere ver Krav de Avsnitt u Område */
  onSelectScope?: (scope: KravListFilter) => void;
}

export const NavigationTree = ({
  delList,
  selectedStyckeId,
  selectedScope,
  onSelectStycke,
  expandedDelId,
  expandedAvsnittId,
  onExpandDel,
  onExpandAvsnitt,
  expandedOmradeId,
  onExpandOmrade,
  onSelectScope,
}: Props) => {
  const sortedDelList = useSortedArray(delList, 'id', 'asc');

  // Prefetch de listas de Krav
  const qc = useQueryClient();
  const prefetch = useCallback(
    (scope: KravListFilter) =>
      qc.prefetchQuery({
        queryKey: kravListKey(scope),
        queryFn: () => fetchKravList(scope),
        staleTime: 30_000,
      }),
    [qc],
  );

  // Del (edit)
  const [editDel, setEditDel] = useState<Del | null>(null);

  // Avsnitt (create desde DEL, edit)
  const [createAvsnittDelId, setCreateAvsnittDelId] = useState<number | null>(null);
  const [editAvsnitt, setEditAvsnitt] = useState<AvsnittType | null>(null);

  // Område (create desde AVSNITT, edit)
  const [createOmradeAvsnittId, setCreateOmradeAvsnittId] = useState<number | null>(null);
  const [editOmrade, setEditOmrade] = useState<OmradeType | null>(null);

  // 👉 Stycke (create desde OMRÅDE, edit/borrar en STYCKE)
  const [createStyckeOmradeId, setCreateStyckeOmradeId] = useState<number | null>(null);
  const [editStycke, setEditStycke] = useState<StyckeType | null>(null);

  const TreeBody = () => (
    <div role='tree' aria-label='Navigation tree' className='space-y-2'>
      {sortedDelList.map((del) => (
        <DelNode
          key={del.id}
          del={del}
          selectedScope={selectedScope ?? null}
          onSelectStycke={onSelectStycke}
          selectedStyckeId={selectedStyckeId}
          expandedDelId={expandedDelId}
          expandedAvsnittId={expandedAvsnittId}
          onExpandDel={onExpandDel}
          onExpandAvsnitt={onExpandAvsnitt}
          expandedOmradeId={expandedOmradeId}
          onExpandOmrade={onExpandOmrade}
          onSelectScope={onSelectScope}
          onPrefetch={prefetch}
          // Handlers superiores
          onOpenDelEdit={(d) => setEditDel(d)}
          onOpenAvsnittCreate={(delId) => setCreateAvsnittDelId(delId)}
          onOpenAvsnittEdit={(a) => setEditAvsnitt(a)}
          onOpenOmradeCreate={(avsnittId) => setCreateOmradeAvsnittId(avsnittId)}
          onOpenOmradeEdit={(o) => setEditOmrade(o)}
          onOpenStyckeCreate={(omradeId) => setCreateStyckeOmradeId(omradeId)}
          onOpenStyckeEdit={(s) => setEditStycke(s)}
        />
      ))}
    </div>
  );

  return (
    <nav className='w-full'>
      {/* Mobile */}
      <div className='md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pt-[env(safe-area-inset-top)]'>
        <div className='flex items-center justify-between px-3 py-2'>
          <span className='text-sm font-medium'>Index</span>
        </div>
      </div>

      <div className='md:hidden px-2 pb-3 pt-2'>
        <div className='rounded-2xl border bg-card p-2.5 sm:p-3 shadow-sm'>
          <div className='max-h-[min(80dvh,calc(100dvh-6rem))] sm:max-h-[min(80vh,calc(100vh-10rem))] overflow-y-auto pr-1 overscroll-contain'>
            <TreeBody key='mobile-tree' />
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className='hidden md:block'>
        <div className='rounded-2xl border bg-card p-3 shadow-sm'>
          <div className='max-h-[calc(100vh-12rem)] overflow-y-auto pr-1'>
            <TreeBody key='desktop-tree' />
          </div>
        </div>
      </div>

      {/* Dialogs */}

      {/* Del (edit/delete) */}
      <Dialog open={!!editDel} onOpenChange={(open) => !open && setEditDel(null)}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Redigera DEL</DialogTitle>
          </DialogHeader>
          {editDel ? (
            <DelForm mode='edit' initialDel={editDel} onClose={() => setEditDel(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Avsnitt (create) */}
      <Dialog
        open={createAvsnittDelId != null}
        onOpenChange={(open) => !open && setCreateAvsnittDelId(null)}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Skapa AVSNITT</DialogTitle>
          </DialogHeader>
          {createAvsnittDelId != null ? (
            <AvsnittForm
              mode='create'
              parentDelId={createAvsnittDelId}
              onCreated={(created) => {
                onExpandDel(createAvsnittDelId);
                onExpandAvsnitt(created.id);
                onSelectScope?.({ avsnittId: created.id });
              }}
              onClose={() => setCreateAvsnittDelId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Avsnitt (edit/delete) */}
      <Dialog open={!!editAvsnitt} onOpenChange={(open) => !open && setEditAvsnitt(null)}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Redigera AVSNITT</DialogTitle>
          </DialogHeader>
          {editAvsnitt ? (
            <AvsnittForm
              mode='edit'
              initialAvsnitt={editAvsnitt}
              onClose={() => setEditAvsnitt(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Område (create) */}
      <Dialog
        open={createOmradeAvsnittId != null}
        onOpenChange={(open) => !open && setCreateOmradeAvsnittId(null)}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Skapa OMRÅDE</DialogTitle>
          </DialogHeader>
          {createOmradeAvsnittId != null ? (
            <OmradeForm
              mode='create'
              parentAvsnittId={createOmradeAvsnittId}
              onCreated={(created) => {
                onExpandAvsnitt(created.avsnittId);
                onExpandOmrade?.(created.id);
                onSelectScope?.({ omradeId: created.id });
              }}
              onClose={() => setCreateOmradeAvsnittId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Område (edit/delete) */}
      <Dialog open={!!editOmrade} onOpenChange={(open) => !open && setEditOmrade(null)}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Redigera OMRÅDE</DialogTitle>
          </DialogHeader>
          {editOmrade ? (
            <OmradeForm
              mode='edit'
              initialOmrade={editOmrade}
              onClose={() => setEditOmrade(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* 👉 Stycke (create desde OMRÅDE) */}
      <Dialog
        open={createStyckeOmradeId != null}
        onOpenChange={(open) => !open && setCreateStyckeOmradeId(null)}
      >
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Skapa STYCKE</DialogTitle>
          </DialogHeader>
          {createStyckeOmradeId != null ? (
            <StyckeForm
              mode='create'
              parentOmradeId={createStyckeOmradeId}
              onCreated={(created) => {
                // expandir Område y seleccionar el Stycke recién creado
                onExpandOmrade?.(created.omradeId);
                onSelectStycke(created.id);
              }}
              onClose={() => setCreateStyckeOmradeId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* 👉 Stycke (edit/delete) */}
      <Dialog open={!!editStycke} onOpenChange={(open) => !open && setEditStycke(null)}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Redigera STYCKE</DialogTitle>
          </DialogHeader>
          {editStycke ? (
            <StyckeForm
              mode='edit'
              initialStycke={editStycke}
              onClose={() => setEditStycke(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </nav>
  );
};

/* ---------------- Nodes ---------------- */

const DelNode = ({
  del,
  selectedScope,
  onSelectStycke,
  selectedStyckeId,
  expandedDelId,
  expandedAvsnittId,
  onExpandDel,
  onExpandAvsnitt,
  expandedOmradeId,
  onExpandOmrade,
  onSelectScope,
  onPrefetch,
  onOpenDelEdit,
  onOpenAvsnittCreate,
  onOpenAvsnittEdit,
  onOpenOmradeCreate,
  onOpenOmradeEdit,
  onOpenStyckeCreate,
  onOpenStyckeEdit,
}: {
  del: Del;
  selectedScope: KravListFilter | null;
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  expandedDelId: number | null;
  expandedAvsnittId: number | null;
  onExpandDel: (id: number) => void;
  onExpandAvsnitt: (id: number) => void;
  expandedOmradeId?: number | null;
  onExpandOmrade?: (id: number) => void;
  onSelectScope?: (scope: KravListFilter) => void;
  onPrefetch: (scope: KravListFilter) => void;
  onOpenDelEdit: (del: Del) => void;
  onOpenAvsnittCreate: (delId: number) => void;
  onOpenAvsnittEdit: (a: AvsnittType) => void;
  onOpenOmradeCreate: (avsnittId: number) => void;
  onOpenOmradeEdit: (o: OmradeType) => void;
  onOpenStyckeCreate: (omradeId: number) => void;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const isExpanded = expandedDelId === del.id;

  return (
    <div className='mb-3'>
      <h2
        className='group relative font-semibold cursor-pointer flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition'
        onClick={() => onExpandDel(isExpanded ? -1 : del.id)}
        aria-expanded={isExpanded}
        role='treeitem'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpandDel(isExpanded ? -1 : del.id);
          }
        }}
      >
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 shrink-0' />
        ) : (
          <ChevronRight className='h-4 w-4 shrink-0' />
        )}
        <span className='truncate'>
          {del.kod} – {del.namn}
        </span>
        <TreeNodeActions
          level='del'
          id={del.id}
          onCreate={(level, id) => level === 'del' && onOpenAvsnittCreate(id)}
          onEdit={() => onOpenDelEdit(del)}
          onDelete={() => onOpenDelEdit(del)}
        />
      </h2>

      {isExpanded && (
        <div className='pl-4 mt-1 border-l border-border/60'>
          <AvsnittListLazy
            delId={del.id}
            selectedScope={selectedScope}
            onSelectStycke={onSelectStycke}
            selectedStyckeId={selectedStyckeId}
            expandedAvsnittId={expandedAvsnittId}
            onExpandAvsnitt={onExpandAvsnitt}
            expandedOmradeId={expandedOmradeId}
            onExpandOmrade={onExpandOmrade}
            onSelectScope={onSelectScope}
            onPrefetch={onPrefetch}
            onOpenAvsnittEdit={onOpenAvsnittEdit}
            onOpenOmradeCreate={onOpenOmradeCreate}
            onOpenOmradeEdit={onOpenOmradeEdit}
            onOpenStyckeCreate={onOpenStyckeCreate}
            onOpenStyckeEdit={onOpenStyckeEdit}
          />
        </div>
      )}
    </div>
  );
};

const AvsnittListLazy = ({
  delId,
  selectedScope,
  onSelectStycke,
  selectedStyckeId,
  expandedAvsnittId,
  onExpandAvsnitt,
  expandedOmradeId,
  onExpandOmrade,
  onSelectScope,
  onPrefetch,
  onOpenAvsnittEdit,
  onOpenOmradeCreate,
  onOpenOmradeEdit,
  onOpenStyckeCreate,
  onOpenStyckeEdit,
}: {
  delId: number;
  selectedScope: KravListFilter | null;
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  expandedAvsnittId: number | null;
  onExpandAvsnitt: (id: number) => void;
  expandedOmradeId?: number | null;
  onExpandOmrade?: (id: number) => void;
  onSelectScope?: (scope: KravListFilter) => void;
  onPrefetch: (scope: KravListFilter) => void;
  onOpenAvsnittEdit: (a: AvsnittType) => void;
  onOpenOmradeCreate: (avsnittId: number) => void;
  onOpenOmradeEdit: (o: OmradeType) => void;
  onOpenStyckeCreate: (omradeId: number) => void;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const { data: avsnittList = [] } = useAvsnittList(delId);
  const sortedAvsnittList = useSortedArray(avsnittList, 'id', 'asc');

  return (
    <>
      {sortedAvsnittList.map((avsnitt) => (
        <AvsnittNode
          key={avsnitt.id}
          avsnitt={avsnitt}
          selectedScope={selectedScope}
          onSelectStycke={onSelectStycke}
          selectedStyckeId={selectedStyckeId}
          expandedAvsnittId={expandedAvsnittId}
          onExpandAvsnitt={onExpandAvsnitt}
          expandedOmradeId={expandedOmradeId}
          onExpandOmrade={onExpandOmrade}
          onSelectScope={onSelectScope}
          onPrefetch={onPrefetch}
          onOpenAvsnittEdit={onOpenAvsnittEdit}
          onOpenOmradeCreate={onOpenOmradeCreate}
          onOpenOmradeEdit={onOpenOmradeEdit}
          onOpenStyckeCreate={onOpenStyckeCreate}
          onOpenStyckeEdit={onOpenStyckeEdit}
        />
      ))}
    </>
  );
};

const AvsnittNode = ({
  avsnitt,
  selectedScope,
  onSelectStycke,
  selectedStyckeId,
  expandedAvsnittId,
  onExpandAvsnitt,
  expandedOmradeId,
  onExpandOmrade,
  onSelectScope,
  onPrefetch,
  onOpenAvsnittEdit,
  onOpenOmradeCreate,
  onOpenOmradeEdit,
  onOpenStyckeCreate,
  onOpenStyckeEdit,
}: {
  avsnitt: AvsnittType;
  selectedScope: KravListFilter | null;
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  expandedAvsnittId: number | null;
  onExpandAvsnitt: (id: number) => void;
  expandedOmradeId?: number | null;
  onExpandOmrade?: (id: number) => void;
  onSelectScope?: (scope: KravListFilter) => void;
  onPrefetch: (scope: KravListFilter) => void;
  onOpenAvsnittEdit: (a: AvsnittType) => void;
  onOpenOmradeCreate: (avsnittId: number) => void;
  onOpenOmradeEdit: (o: OmradeType) => void;
  onOpenStyckeCreate: (omradeId: number) => void;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const { data: omradeList = [] } = useOmradeList(avsnitt.id);
  const sortedOmradeList = useSortedArray(omradeList, 'id', 'asc');
  const hasOmradeChildren = sortedOmradeList.length > 0;

  const { data: svarAvsnitt = [] } = useSvarIndicatorByAvsnitt(avsnitt.id);
  const { data: kravAvsnitt = [] } = useKravList({ avsnittId: avsnitt.id });
  const hasKravAtAvsnitt = kravAvsnitt.length > 0;

  let indicatorColor: 'red' | 'yellow' | 'green' | undefined;
  if (hasKravAtAvsnitt) {
    indicatorColor =
      svarAvsnitt.length === 0
        ? 'red'
        : svarAvsnitt.every((s) => (s.betyg ?? 0) >= 3 && s.jaNej === true)
          ? 'green'
          : 'yellow';
  }

  const isExpanded = expandedAvsnittId === avsnitt.id;
  const isSelectedAvsnitt =
    selectedScope != null && typeof (selectedScope as { avsnittId?: number }).avsnittId === 'number'
      ? (selectedScope as { avsnittId: number }).avsnittId === avsnitt.id
      : false;

  const scope = { avsnittId: avsnitt.id } as KravListFilter;

  const handleClick = () => {
    onSelectScope?.(scope);
    if (hasOmradeChildren && !isExpanded) onExpandAvsnitt(avsnitt.id);
  };

  return (
    <div className='mb-2'>
      <h3
        className={[
          ' group relative text-sm font-medium flex items-center gap-2 rounded-lg px-2 py-1 transition cursor-pointer',
          isSelectedAvsnitt
            ? 'bg-muted text-primary font-semibold shadow-sm ring-1 ring-primary/20'
            : 'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        ].join(' ')}
        onMouseEnter={() => onPrefetch(scope)}
        onFocus={() => onPrefetch(scope)}
        onClick={handleClick}
        onDoubleClick={() => {
          if (hasOmradeChildren) onExpandAvsnitt(isExpanded ? -1 : avsnitt.id);
        }}
        aria-expanded={hasOmradeChildren ? isExpanded : undefined}
        aria-selected={isSelectedAvsnitt || undefined}
        role='treeitem'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {hasOmradeChildren ? (
          isExpanded ? (
            <ChevronDown className='h-4 w-4 shrink-0' />
          ) : (
            <ChevronRight className='h-4 w-4 shrink-0' />
          )
        ) : (
          <span className='h-4 w-4 shrink-0' />
        )}

        {indicatorColor && (
          <span
            className={[
              'h-2 w-2 rounded-full shrink-0',
              indicatorColor === 'red'
                ? 'bg-red-500'
                : indicatorColor === 'green'
                  ? 'bg-green-500'
                  : 'bg-yellow-400',
            ].join(' ')}
          />
        )}

        <span className='truncate'>
          {avsnitt.kod} – {avsnitt.namn}
        </span>

        <TreeNodeActions
          level='avsnitt'
          id={avsnitt.id}
          onCreate={(level, id) => {
            if (level !== 'avsnitt') return;
            onOpenOmradeCreate(id);
          }}
          onEdit={() => onOpenAvsnittEdit(avsnitt)}
          onDelete={() => onOpenAvsnittEdit(avsnitt)}
        />
      </h3>

      {hasOmradeChildren && isExpanded && (
        <div className='pl-4 mt-1 space-y-2'>
          <OmradeListLazy
            avsnittId={avsnitt.id}
            selectedScope={selectedScope}
            onSelectStycke={onSelectStycke}
            selectedStyckeId={selectedStyckeId}
            controlledExpandedOmradeId={expandedOmradeId}
            onToggleFromParent={onExpandOmrade}
            onSelectScope={onSelectScope}
            onPrefetch={onPrefetch}
            onOpenOmradeEdit={onOpenOmradeEdit}
            onOpenStyckeCreate={onOpenStyckeCreate}
            onOpenStyckeEdit={onOpenStyckeEdit}
          />
        </div>
      )}
    </div>
  );
};

const OmradeListLazy = ({
  avsnittId,
  selectedScope,
  onSelectStycke,
  selectedStyckeId,
  controlledExpandedOmradeId,
  onToggleFromParent,
  onSelectScope,
  onPrefetch,
  onOpenOmradeEdit,
  onOpenStyckeCreate,
  onOpenStyckeEdit,
}: {
  avsnittId: number;
  selectedScope: KravListFilter | null;
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  controlledExpandedOmradeId?: number | null;
  onToggleFromParent?: (id: number) => void;
  onSelectScope?: (scope: KravListFilter) => void;
  onPrefetch: (scope: KravListFilter) => void;
  onOpenOmradeEdit: (o: OmradeType) => void;
  onOpenStyckeCreate: (omradeId: number) => void;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const { data: omradeList = [] } = useOmradeList(avsnittId);
  const sortedOmradeList = useSortedArray(omradeList, 'id', 'asc');

  return (
    <>
      {sortedOmradeList.map((omrade) => (
        <OmradeGroup
          key={omrade.id}
          omrade={{ id: omrade.id, kod: omrade.kod, namn: omrade.namn }}
          parentAvsnittId={avsnittId}
          selectedScope={selectedScope}
          onSelectStycke={onSelectStycke}
          selectedStyckeId={selectedStyckeId}
          controlledExpandedOmradeId={controlledExpandedOmradeId}
          onToggleFromParent={onToggleFromParent}
          onSelectScope={onSelectScope}
          onPrefetch={onPrefetch}
          onOpenOmradeEdit={onOpenOmradeEdit}
          onOpenStyckeCreate={onOpenStyckeCreate}
          onOpenStyckeEdit={onOpenStyckeEdit}
        />
      ))}
    </>
  );
};

const OmradeGroup = ({
  omrade,
  parentAvsnittId,
  selectedScope,
  onSelectStycke,
  selectedStyckeId,
  controlledExpandedOmradeId,
  onToggleFromParent,
  onSelectScope,
  onPrefetch,
  onOpenOmradeEdit,
  onOpenStyckeCreate,
  onOpenStyckeEdit,
}: {
  omrade: { id: number; kod: string; namn: string };
  parentAvsnittId: number;
  selectedScope: KravListFilter | null;
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  controlledExpandedOmradeId?: number | null;
  onToggleFromParent?: (id: number) => void;
  onSelectScope?: (scope: KravListFilter) => void;
  onPrefetch: (scope: KravListFilter) => void;
  onOpenOmradeEdit: (o: OmradeType) => void;
  onOpenStyckeCreate: (omradeId: number) => void;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const { data: styckeList = [] } = useStyckeList(omrade.id);
  const sortedStyckeList = useSortedArray(styckeList, 'id', 'asc');
  const hasStyckeChildren = sortedStyckeList.length > 0;

  const { data: svarOmrade = [] } = useSvarIndicatorByOmrade(omrade.id);
  const { data: kravOmrade = [] } = useKravList({ omradeId: omrade.id });
  const hasKravAtOmrade = kravOmrade.length > 0;

  let indicatorColor: 'red' | 'yellow' | 'green' | undefined;
  if (hasKravAtOmrade) {
    indicatorColor =
      svarOmrade.length === 0
        ? 'red'
        : svarOmrade.every((s) => (s.betyg ?? 0) >= 3 && s.jaNej === true)
          ? 'green'
          : 'yellow';
  }

  const controlled = typeof controlledExpandedOmradeId !== 'undefined';
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<boolean>(false);
  const isExpanded = controlled ? controlledExpandedOmradeId === omrade.id : uncontrolledExpanded;

  const isSelectedOmrade =
    selectedScope != null && typeof (selectedScope as { omradeId?: number }).omradeId === 'number'
      ? (selectedScope as { omradeId: number }).omradeId === omrade.id
      : false;

  const toggle = () => {
    if (!hasStyckeChildren) return;
    if (controlled) {
      const next = isExpanded ? -1 : omrade.id;
      onToggleFromParent?.(next);
    } else {
      setUncontrolledExpanded((v) => !v);
    }
  };

  const scope = { omradeId: omrade.id } as KravListFilter;

  const handleClick = () => {
    onSelectScope?.(scope);
    if (hasStyckeChildren && !isExpanded) {
      if (controlled) onToggleFromParent?.(omrade.id);
      else setUncontrolledExpanded(true);
    }
  };

  return (
    <div className='mb-1'>
      <div
        className={[
          'group relative flex items-center gap-2 px-2 py-0.5 text-sm rounded-md cursor-pointer',
          isSelectedOmrade
            ? 'bg-muted text-primary font-semibold shadow-sm ring-1 ring-primary/20'
            : 'hover:bg-accent/40',
        ].join(' ')}
        role='treeitem'
        aria-selected={isSelectedOmrade || undefined}
        aria-expanded={hasStyckeChildren ? isExpanded : undefined}
        tabIndex={0}
        onMouseEnter={() => onPrefetch(scope)}
        onFocus={() => onPrefetch(scope)}
        onClick={handleClick}
        onDoubleClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {hasStyckeChildren ? (
          isExpanded ? (
            <ChevronDown className='h-3.5 w-3.5 shrink-0' />
          ) : (
            <ChevronRight className='h-3.5 w-3.5 shrink-0' />
          )
        ) : (
          <span className='h-3.5 w-3.5 shrink-0' />
        )}

        {indicatorColor && (
          <span
            className={[
              'h-2 w-2 rounded-full shrink-0',
              indicatorColor === 'red'
                ? 'bg-red-500'
                : indicatorColor === 'green'
                  ? 'bg-green-500'
                  : 'bg-yellow-400',
            ].join(' ')}
          />
        )}

        <span className='font-medium text-foreground truncate'>
          {omrade.kod} – {omrade.namn}
        </span>

        <TreeNodeActions
          level='omrade'
          id={omrade.id}
          onCreate={(level, id) => {
            if (level !== 'omrade') return;
            // 👉 Crear Stycke dentro de este Område
            onOpenStyckeCreate(id);
          }}
          onEdit={() =>
            onOpenOmradeEdit({
              id: omrade.id,
              kod: omrade.kod,
              namn: omrade.namn,
              avsnittId: parentAvsnittId,
            })
          }
          onDelete={() =>
            onOpenOmradeEdit({
              id: omrade.id,
              kod: omrade.kod,
              namn: omrade.namn,
              avsnittId: parentAvsnittId,
            })
          }
        />
      </div>

      {hasStyckeChildren && isExpanded && (
        <ul className='pl-6 list-disc text-sm mt-1 space-y-0.5'>
          <StyckeListLazy
            omradeId={omrade.id}
            onSelect={onSelectStycke}
            selectedStyckeId={selectedStyckeId}
            // editar/borrar stycke desde el item
            onOpenStyckeEdit={onOpenStyckeEdit}
          />
        </ul>
      )}
    </div>
  );
};

const StyckeListLazy = ({
  omradeId,
  onSelect,
  selectedStyckeId,
  onOpenStyckeEdit,
}: {
  omradeId: number;
  onSelect: (id: number) => void;
  selectedStyckeId: number | null;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const { data: styckeList = [] } = useStyckeList(omradeId);
  const sortedStyckeList = useSortedArray(styckeList, 'id', 'asc');

  return (
    <>
      {sortedStyckeList.map((stycke) => (
        <StyckeItem
          key={stycke.id}
          stycke={stycke}
          parentOmradeId={omradeId}
          onSelect={onSelect}
          selected={selectedStyckeId === stycke.id}
          onOpenStyckeEdit={onOpenStyckeEdit}
        />
      ))}
    </>
  );
};

const StyckeItem = ({
  stycke,
  parentOmradeId,
  onSelect,
  selected,
  onOpenStyckeEdit,
}: {
  stycke: { id: number; kod: string; namn: string };
  parentOmradeId: number;
  onSelect: (id: number) => void;
  selected: boolean;
  onOpenStyckeEdit: (s: StyckeType) => void;
}) => {
  const { data: kravList = [] } = useKravList({ styckeId: stycke.id });
  const hasKravAtStycke = kravList.length > 0;
  const { data: svarList = [] } = useSvarIndicatorByStycke(stycke.id);

  let indicatorColor: 'red' | 'yellow' | 'green' | undefined;
  if (hasKravAtStycke) {
    indicatorColor =
      svarList.length === 0
        ? 'red'
        : svarList.every((s) => (s.betyg ?? 0) >= 3 && s.jaNej === true)
          ? 'green'
          : 'yellow';
  }

  return (
    <li
      className={[
        'group relative flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md transition',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'bg-muted text-primary font-semibold shadow-sm'
          : 'hover:bg-accent/50 hover:text-primary',
      ].join(' ')}
      onClick={() => onSelect(stycke.id)}
      role='treeitem'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(stycke.id);
        }
      }}
    >
      {indicatorColor && (
        <span
          className={[
            'h-2 w-2 rounded-full shrink-0',
            indicatorColor === 'red'
              ? 'bg-red-500'
              : indicatorColor === 'green'
                ? 'bg-green-500'
                : 'bg-yellow-400',
            selected ? 'ring-2 ring-primary/70' : '',
          ].join(' ')}
        />
      )}

      <span className='truncate'>
        {stycke.kod} – {stycke.namn}
      </span>

      {/* At the PIECE level: solo Manage / Delete (sin Create) */}
      <TreeNodeActions
        level='stycke'
        id={stycke.id}
        onEdit={() =>
          onOpenStyckeEdit({
            id: stycke.id,
            kod: stycke.kod,
            namn: stycke.namn,
            omradeId: parentOmradeId,
          } as StyckeType)
        }
        onDelete={() =>
          onOpenStyckeEdit({
            id: stycke.id,
            kod: stycke.kod,
            namn: stycke.namn,
            omradeId: parentOmradeId,
          } as StyckeType)
        }
      />
    </li>
  );
};
