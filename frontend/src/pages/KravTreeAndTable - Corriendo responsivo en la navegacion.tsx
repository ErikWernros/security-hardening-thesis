// src/pages/KravTreeAndTable.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDelList } from '@/hooks/useDel';
import { apiClient } from '@/lib/axios';
import { NavigationTree } from './NavigationTree';
import { KravTableView } from './KravTableView';

// UI/Icons (keep names intact elsewhere; adding imports is allowed)
// -- Using shadcn/ui primitives already present in the project
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { PanelLeft, ChevronRight } from 'lucide-react';

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

  // New: mobile nav sheet state (responsive)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (styckeParents) {
      setExpandedDelId(styckeParents.delId);
      setExpandedAvsnittId(styckeParents.avsnittId);
    }
  }, [styckeParents]);

  const handleSelectStycke = (id: number) => {
    setSelectedStyckeId(id);
    localStorage.setItem('selectedStyckeId', id.toString());
    // Close mobile sheet once user selects a node
    setIsMobileNavOpen(false);
  };

  return (
    <div
      className='flex h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-background to-muted/40
                 sm:h-[calc(100vh-6rem)]'
      // NOTE(UX): full-height workspace below the app header
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
                  {/* NOTE(UX): reusing the same tree inside the sheet */}
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

            {/* Breadcrumbs using styckeParents when available */}
            <nav
              className='flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto'
              aria-label='Brödsmulor'
            >
              <span className='truncate max-w-[20vw] sm:max-w-[25vw] md:max-w-[30vw]'>
                {styckeParents?.delKod ?? 'Del'}
                {styckeParents?.delNamn ? ` – ${styckeParents.delNamn}` : ''}
              </span>
              <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
              <span className='truncate max-w-[20vw] sm:max-w-[25vw] md:max-w-[30vw]'>
                {styckeParents?.avsnittKod ?? 'Avsnitt'}
                {styckeParents?.avsnittNamn ? ` – ${styckeParents.avsnittNamn}` : ''}
              </span>
              <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
              <span className='truncate max-w-[28vw] font-medium text-foreground'>
                {styckeParents?.styckeKod ?? 'Stycke'}
                {styckeParents?.styckeNamn ? ` – ${styckeParents.styckeNamn}` : ''}
              </span>
            </nav>
          </div>
        </div>

        {/* Content area with its own scroll */}
        <div className='flex-1 overflow-auto p-3 md:p-4'>
          {selectedStyckeId ? (
            <div
              className='rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm
                         transition-all duration-200 hover:shadow-md'
            >
              {/* INFO: Encapsulate table view for better spacing on all screens */}
              <div className='p-3 md:p-4'>
                <KravTableView styckeId={selectedStyckeId} />
              </div>
            </div>
          ) : (
            <div
              className='h-full flex items-center justify-center text-center
                         text-muted-foreground'
            >
              <p className='max-w-[48ch] text-balance'>
                Välj ett stycke till vänster för att visa dess{' '}
                <span className='font-medium'>Krav</span>. På mobilen, toca el botón{' '}
                <span className='inline-flex align-middle rounded-md border px-2 py-0.5 text-xs'>
                  <PanelLeft className='h-3.5 w-3.5 mr-1' /> Navigation
                </span>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
