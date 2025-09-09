// src/pages/KravTreeAndTable.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDelList } from '@/hooks/useDel';
import { apiClient } from '@/lib/axios';
import { NavigationTree } from './NavigationTree';
import { KravTableView } from './KravTableView';
import { KravBreadcrumbs } from '@/components/krav/KravBreadcrumbs';
import { type RawParents } from '@/types/domainTypes';
import IsagLogo from '@/assets/IsagLogo.svg';

// UI/Icons
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { PanelLeft } from 'lucide-react';

// -------------------------------------
// Backend shapes (strict, no 'any')
// -------------------------------------
/*interface RawParents {
  delId: number;
  avsnittId: number;
}*/

export const KravTreeAndTable = () => {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlStyckeId = queryParams.get('styckeId');

  // -------------------------------------
  // Selected node (persisted)
  // -------------------------------------
  const [selectedStyckeId, setSelectedStyckeId] = useState<number | null>(() => {
    if (urlStyckeId) return parseInt(urlStyckeId, 10);
    const stored = localStorage.getItem('selectedStyckeId');
    return stored ? parseInt(stored, 10) : null;
  });

  // -------------------------------------
  // Left tree root list (Del)
  // -------------------------------------
  const { data: delList = [] } = useDelList();

  // -------------------------------------
  // Query: Get parents IDs for current stycke (for tree expansion)
  // Return { delId, avsnittId }
  // -------------------------------------
  const { data: parentsIds } = useQuery<RawParents | null>({
    queryKey: ['styckeParentsIds', selectedStyckeId],
    queryFn: async () => {
      if (!selectedStyckeId) return null;
      const res = await apiClient.get<RawParents>(`/api/stycke/${selectedStyckeId}/parents`);
      return res.data ?? null;
    },
    enabled: !!selectedStyckeId,
  });

  // -------------------------------------
  // Tree expand state
  // -------------------------------------
  const [expandedDelId, setExpandedDelId] = useState<number | null>(null);
  const [expandedAvsnittId, setExpandedAvsnittId] = useState<number | null>(null);

  // -------------------------------------
  // Mobile sheet state
  // -------------------------------------
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Expand the correct branches when we know the parent IDs
  useEffect(() => {
    if (parentsIds?.delId) setExpandedDelId(parentsIds.delId);
    if (parentsIds?.avsnittId) setExpandedAvsnittId(parentsIds.avsnittId);
  }, [parentsIds?.delId, parentsIds?.avsnittId]);

  // Handle selection from tree
  const handleSelectStycke = (id: number) => {
    setSelectedStyckeId(id);
    localStorage.setItem('selectedStyckeId', id.toString());
    setIsMobileNavOpen(false);
  };

  return (
    <div
      className='flex h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-background to-muted/40
                 sm:h-[calc(100vh-6rem)]'
    >
      {/* Desktop Sidebar */}
      <aside
        className='hidden lg:block w-[360px] max-w-[40vw] border-r bg-card/50 backdrop-blur-sm
                   overflow-auto p-3 md:p-4'
        aria-label='Navigationspanel'
      >
        <div className='sticky top-0 z-10 bg-card/70 backdrop-blur-sm -mx-3 md:-mx-4 px-3 md:px-4 py-2'>
          <h2 className='text-sm font-semibold tracking-wide text-muted-foreground'>Navigering</h2>
        </div>

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

      {/* Main area */}
      <main className='flex-1 overflow-hidden flex flex-col'>
        {/* Top bar: mobile trigger + breadcrumbs */}
        <div
          className='sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
                     border-b px-3 md:px-4 py-2'
        >
          <div className='flex items-center gap-2'>
            {/* Mobile open sidebar */}
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild className='lg:hidden'>
                <Button variant='outline' size='icon' aria-label='Öppna navigation'>
                  <PanelLeft className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-[85vw] sm:w-[380px] p-0'>
                <SheetHeader className='px-4 pt-4 pb-2'>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <Separator />
                <div className='h-[calc(100%-3.5rem)] overflow-auto p-3 md:p-4'>
                  {/* Reuse the same tree inside the sheet */}
                  <NavigationTree
                    delList={delList}
                    selectedStyckeId={selectedStyckeId}
                    onSelectStycke={handleSelectStycke}
                    expandedDelId={expandedDelId}
                    expandedAvsnittId={expandedAvsnittId}
                    onExpandDel={(id) => setExpandedDelId(id)}
                    onExpandAvsnitt={(id) => setExpandedAvsnittId(id)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumbs:
               - Keep prop names intact.
               - Pass a dummy value (null) so the component resuelva todo internamente.
               - Force remount on selection change to re-read localStorage and update. */}
            {/*<KravBreadcrumbs key={selectedStyckeId ?? 'none'} styckeParents={null} />*/}
            <KravBreadcrumbs styckeParents={null} />
          </div>
        </div>

        {/* Content area with its own scroll */}
        <div className='flex-1 overflow-auto p-3 md:p-4'>
          {selectedStyckeId ? (
            <div
              className='rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm
                         transition-all duration-200 hover:shadow-md'
            >
              <div className='p-3 md:p-4'>
                <KravTableView styckeId={selectedStyckeId} />
              </div>
            </div>
          ) : (
            <div className='h-full flex flex-col items-center justify-center text-center text-muted-foreground'>
              {/* Logo on top */}
              <img src={IsagLogo} alt='Isag Logo' className='h-38 w-100' />
              {/* Helper text */}
              <p className='mt-4 max-w-[48ch] text-balance'>
                Välj ett stycke till vänster för att visa dess{' '}
                <span className='font-medium'>Krav</span>.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
