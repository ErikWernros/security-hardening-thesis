// src/pages/KravTreeAndTable.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDelList } from '@/hooks/useDel';
import { apiClient } from '@/lib/axios';
import { NavigationTree } from './NavigationTree';
import { KravTableView } from './KravTableView';

export const KravTreeAndTable = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlStyckeId = queryParams.get('styckeId');

  const [selectedStyckeId, setSelectedStyckeId] = useState<number | null>(() => {
    if (urlStyckeId) return parseInt(urlStyckeId);
    const stored = localStorage.getItem('selectedStyckeId');
    return stored ? parseInt(stored) : null;
  });

  const { data: delList = [] } = useDelList();

  const { data: styckeParents } = useQuery({
    queryKey: ['styckeParents', selectedStyckeId],
    queryFn: async () => {
      if (!selectedStyckeId) return null;
      const res = await apiClient.get(`/api/stycke/${selectedStyckeId}/parents`);
      return res.data;
    },
    enabled: !!selectedStyckeId,
  });

  const [expandedDelId, setExpandedDelId] = useState<number | null>(null);
  const [expandedAvsnittId, setExpandedAvsnittId] = useState<number | null>(null);

  useEffect(() => {
    if (styckeParents) {
      setExpandedDelId(styckeParents.delId);
      setExpandedAvsnittId(styckeParents.avsnittId);
    }
  }, [styckeParents]);

  const handleSelectStycke = (id: number) => {
    setSelectedStyckeId(id);
    localStorage.setItem('selectedStyckeId', id.toString());
  };

  return (
    <div className='flex w-full h-full'>
      <aside className='w-1/3 border-r overflow-auto p-4'>
        <NavigationTree
          delList={delList}
          selectedStyckeId={selectedStyckeId}
          onSelectStycke={handleSelectStycke}
          expandedDelId={expandedDelId}
          expandedAvsnittId={expandedAvsnittId}
          onExpandDel={(id) => setExpandedDelId(id)}
          onExpandAvsnitt={(id) => setExpandedAvsnittId(id)}
        />
      </aside>
      <main className='flex-1 overflow-auto p-4'>
        {selectedStyckeId ? (
          <KravTableView styckeId={selectedStyckeId} />
        ) : (
          <p className='text-muted-foreground'>Välj ett stycke till vänster...</p>
        )}
      </main>
    </div>
  );
};
