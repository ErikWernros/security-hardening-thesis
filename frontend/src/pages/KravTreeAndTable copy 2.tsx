// src/pages/KravTreeAndTable.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDelList } from '@/hooks/useDel';
import { apiClient } from '@/lib/axios';
import { NavigationTree } from './NavigationTree';
import { KravTableView } from './KravTableView';
import { KravBreadcrumbs } from './KravBreadcrumbs';

// UI
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { PanelLeft } from 'lucide-react';

// 🔐 Tipos existentes
import type { KravBreadcrumbsProps } from '@/types/domainTypes';

// -----------------------------
// Backend raw response types (adjust if your API differs)
// -----------------------------
interface NodeInfo {
  id: number;
  kod: string;
  namn: string;
}
interface RawStyckeParents {
  del?: NodeInfo;
  avsnitt?: NodeInfo;
  stycke?: NodeInfo;
}

// -----------------------------
// Normalizer → returns EXACT shape KravBreadcrumbs expects
// -----------------------------
/** Maps API payload to the flat props that KravBreadcrumbs uses. */
function normalizeStyckeParents(
  data: RawStyckeParents | null,
): KravBreadcrumbsProps['styckeParents'] {
  if (!data?.del || !data?.avsnitt || !data?.stycke) return null;
  return {
    delKod: data.del.kod,
    delNamn: data.del.namn,
    avsnittKod: data.avsnitt.kod,
    avsnittNamn: data.avsnitt.namn,
    styckeKod: data.stycke.kod,
    styckeNamn: data.stycke.namn,
  };
}

export const KravTreeAndTable = () => {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlStyckeId = queryParams.get('styckeId');

  const [selectedStyckeId, setSelectedStyckeId] = useState<number | null>(() => {
    if (urlStyckeId) return parseInt(urlStyckeId, 10);
    const stored = localStorage.getItem('selectedStyckeId');
    return stored ? parseInt(stored, 10) : null;
  });

  const { data: delList = [] } = useDelList();

  // ✅ Tipado estricto: el dato que consume KravBreadcrumbs
  const { data: styckeParents } = useQuery<KravBreadcrumbsProps['styckeParents']>({
    queryKey: ['styckeParents', selectedStyckeId],
    queryFn: async () => {
      if (!selectedStyckeId) return null;
      const res = await apiClient.get<RawStyckeParents>(`/api/stycke/${selectedStyckeId}/parents`);

      if (import.meta.env.DEV) {
        console.debug('[parents raw]', res.data);
      }

      return normalizeStyckeParents(res.data ?? null);
    },
    enabled: !!selectedStyckeId,
  });

  const [expandedDelId, setExpandedDelId] = useState<number | null>(null);
  const [expandedAvsnittId, setExpandedAvsnittId] = useState<number | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    // NOTE: we don’t have ids in breadcrumbs; expand state can be handled elsewhere if needed
    // If you need ids, fetch them in parallel or extend the API to include them.
  }, [styckeParents]);

  const handleSelectStycke = (id: number) => {
    setSelectedStyckeId(id);
    localStorage.setItem('selectedStyckeId', id.toString());
    setIsMobileNavOpen(false);
  };

  return (
    <div className='flex h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-background to-muted/40 sm:h-[calc(100vh-6rem)]'>
      {/* Sidebar */}
      <aside
        className='hidden lg:block w-[360px] max-w-[40vw] border-r bg-card/50 backdrop-blur-sm overflow-auto p-3 md:p-4'
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

      {/* Main */}
      <main className='flex-1 overflow-hidden flex flex-col'>
        <div className='sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 md:px-4 py-2'>
          <div className='flex items-center gap-2'>
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

            {/* 👉 Breadcrumbs recibe exactamente tu interfaz */}
            <KravBreadcrumbs styckeParents={styckeParents} />
          </div>
        </div>

        <div className='flex-1 overflow-auto p-3 md:p-4'>
          {selectedStyckeId ? (
            <div className='rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md'>
              <div className='p-3 md:p-4'>
                <KravTableView styckeId={selectedStyckeId} />
              </div>
            </div>
          ) : (
            <div className='h-full flex items-center justify-center text-center text-muted-foreground'>
              <p className='max-w-[48ch] text-balance'>
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
