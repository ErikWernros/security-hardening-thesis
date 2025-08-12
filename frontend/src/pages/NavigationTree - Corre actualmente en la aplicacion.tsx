// src/components/NavigationTree.tsx
import { type Del } from '@/types/domainTypes';
import { useAvsnittList } from '@/hooks/useAvsnitt';
import { useStyckeList } from '@/hooks/useStycke';
import { useSvarIndicatorByStycke } from '@/hooks/useSvar';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  return (
    <div>
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
        className='font-semibold cursor-pointer flex items-center gap-1'
        onClick={() => onExpandDel(isExpanded ? -1 : del.id)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown className='h-4 w-4' aria-hidden='true' />
        ) : (
          <ChevronRight className='h-4 w-4' aria-hidden='true' />
        )}
        {del.kod} – {del.namn}
      </h2>
      {isExpanded && (
        <div className='pl-4'>
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
        className='text-sm font-medium cursor-pointer flex items-center gap-1'
        onClick={() => onExpandAvsnitt(isExpanded ? -1 : avsnitt.id)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown className='h-4 w-4' aria-hidden='true' />
        ) : (
          <ChevronRight className='h-4 w-4' aria-hidden='true' />
        )}
        {avsnitt.kod} – {avsnitt.namn}
      </h3>
      {isExpanded && (
        <ul className='pl-4 list-disc text-sm'>
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
      className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded ${selected ? 'bg-muted text-primary font-semibold' : 'hover:text-primary'}`}
      onClick={() => onSelect(stycke.id)}
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {stycke.kod} – {stycke.namn}
    </li>
  );
};
