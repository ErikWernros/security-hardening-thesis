// src/components/NavigationTree.tsx
import { type Del } from '@/types/domainTypes';
import { useAvsnittList } from '@/hooks/useAvsnitt';
import { useStyckeList } from '@/hooks/useStycke';
import { useSvarIndicatorByStycke } from '@/hooks/useSvar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  delList: Del[];
  selectedStyckeId: number | null;
  onSelectStycke: (id: number) => void;
  expandedDelId: number | null;
  expandedAvsnittId: number | null;
  onExpandDel: (delId: number) => void;
  onExpandAvsnitt: (avsnittId: number) => void;
}

export const NavigationTree = ({
  delList,
  selectedStyckeId,
  onSelectStycke,
  expandedDelId,
  expandedAvsnittId,
  onExpandDel,
  onExpandAvsnitt,
}: Props) => {
  // Memoize tree to avoid unnecessary re-renders on parent changes
  const tree = useMemo(
    () => (
      <div role='tree' aria-label='Navigation tree' className='space-y-2'>
        {delList.map((del) => (
          <DelNode
            key={del.id}
            del={del}
            onSelectStycke={onSelectStycke}
            selectedStyckeId={selectedStyckeId}
            expandedDelId={expandedDelId}
            expandedAvsnittId={expandedAvsnittId}
            onExpandDel={onExpandDel}
            onExpandAvsnitt={onExpandAvsnitt}
          />
        ))}
      </div>
    ),
    [
      delList,
      onSelectStycke,
      selectedStyckeId,
      expandedDelId,
      expandedAvsnittId,
      onExpandDel,
      onExpandAvsnitt,
    ],
  );

  return (
    <nav className='w-full'>
      {/* Mobile header: sticky, no toggle, tree always visible */}
      <div className='md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b'>
        <div className='flex items-center justify-between px-3 py-2'>
          <span className='text-sm font-medium'>Índice</span>
        </div>
      </div>

      {/* Mobile panel: always shown under header */}
      <div className='md:hidden px-3 pb-3 pt-1'>
        <div className='rounded-2xl border bg-card p-2 shadow-sm'>
          <div className='max-h-[60vh] overflow-y-auto pr-1'>{tree}</div>
        </div>
      </div>

      {/* Desktop / tablet column: always visible */}
      <div className='hidden md:block'>
        <div className='rounded-2xl border bg-card p-3 shadow-sm'>
          {/* Smooth scroll container for long trees */}
          <div className='max-h-[calc(100vh-12rem)] overflow-y-auto pr-1'>{tree}</div>
        </div>
      </div>
    </nav>
  );
};

const DelNode = ({
  del,
  onSelectStycke,
  selectedStyckeId,
  expandedDelId,
  expandedAvsnittId,
  onExpandDel,
  onExpandAvsnitt,
}: {
  del: Del;
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  expandedDelId: number | null;
  expandedAvsnittId: number | null;
  onExpandDel: (id: number) => void;
  onExpandAvsnitt: (id: number) => void;
}) => {
  const { data: avsnittList = [] } = useAvsnittList(del.id);

  const isExpanded = expandedDelId === del.id;

  return (
    <div className='mb-3'>
      {/* Toggle chevron icon based on expansion state; clicking again collapses */}
      <h2
        className='font-semibold cursor-pointer flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition'
        onClick={() => onExpandDel(isExpanded ? -1 : del.id)}
        aria-expanded={isExpanded}
        role='treeitem'
        tabIndex={0}
        onKeyDown={(e) => {
          // Keyboard accessibility: open/close with Enter or Space
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpandDel(isExpanded ? -1 : del.id);
          }
        }}
      >
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 shrink-0' aria-hidden='true' />
        ) : (
          <ChevronRight className='h-4 w-4 shrink-0' aria-hidden='true' />
        )}
        <span className='truncate'>
          {del.kod} – {del.namn}
        </span>
      </h2>
      {isExpanded && (
        <div className='pl-4 mt-1 border-l border-border/60'>
          {avsnittList.map((avsnitt) => (
            <AvsnittNode
              key={avsnitt.id}
              avsnitt={avsnitt}
              onSelectStycke={onSelectStycke}
              selectedStyckeId={selectedStyckeId}
              expandedAvsnittId={expandedAvsnittId}
              onExpandAvsnitt={onExpandAvsnitt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AvsnittNode = ({
  avsnitt,
  onSelectStycke,
  selectedStyckeId,
  expandedAvsnittId,
  onExpandAvsnitt,
}: {
  avsnitt: { id: number; kod: string; namn: string };
  onSelectStycke: (id: number) => void;
  selectedStyckeId: number | null;
  expandedAvsnittId: number | null;
  onExpandAvsnitt: (id: number) => void;
}) => {
  const { data: styckeList = [] } = useStyckeList(avsnitt.id);
  const isExpanded = expandedAvsnittId === avsnitt.id;

  return (
    <div className='mb-2'>
      {/* Toggle chevron icon based on expansion state; clicking again collapses */}
      <h3
        className='text-sm font-medium cursor-pointer flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition'
        onClick={() => onExpandAvsnitt(isExpanded ? -1 : avsnitt.id)}
        aria-expanded={isExpanded}
        role='treeitem'
        tabIndex={0}
        onKeyDown={(e) => {
          // Keyboard accessibility: open/close with Enter or Space
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpandAvsnitt(isExpanded ? -1 : avsnitt.id);
          }
        }}
      >
        {isExpanded ? (
          <ChevronDown className='h-4 w-4 shrink-0' aria-hidden='true' />
        ) : (
          <ChevronRight className='h-4 w-4 shrink-0' aria-hidden='true' />
        )}
        <span className='truncate'>
          {avsnitt.kod} – {avsnitt.namn}
        </span>
      </h3>
      {isExpanded && (
        <ul className='pl-4 list-disc text-sm mt-1 space-y-0.5'>
          {styckeList.map((stycke) => (
            <StyckeItem
              key={stycke.id}
              stycke={stycke}
              onSelect={onSelectStycke}
              selected={selectedStyckeId === stycke.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const StyckeItem = ({
  stycke,
  onSelect,
  selected,
}: {
  stycke: { id: number; kod: string; namn: string };
  onSelect: (id: number) => void;
  selected: boolean;
}) => {
  const { data: svarList = [] } = useSvarIndicatorByStycke(stycke.id);

  let status = 'red';
  if (svarList.length === 0) status = 'red';
  else if (svarList.every((s) => (s.betyg ?? 0) >= 3 && s.jaNej === true)) status = 'green';
  else status = 'yellow';

  const color = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
  }[status];

  return (
    <li
      className={[
        'flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md transition',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'bg-muted text-primary font-semibold shadow-sm'
          : 'hover:bg-accent/50 hover:text-primary',
      ].join(' ')}
      onClick={() => onSelect(stycke.id)}
      role='treeitem'
      tabIndex={0}
      onKeyDown={(e) => {
        // Keyboard support to activate the selection via Enter/Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(stycke.id);
        }
      }}
    >
      <span
        className={[
          'h-2 w-2 rounded-full shrink-0',
          color,
          selected ? 'ring-2 ring-primary/70' : '',
        ].join(' ')}
      />
      <span className='truncate'>
        {stycke.kod} – {stycke.namn}
      </span>
    </li>
  );
};
