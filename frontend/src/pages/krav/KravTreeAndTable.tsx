// src/pages/krav/KravTreeAndTable.tsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useDelList } from '@/hooks/useDel';
import { useStyckeParents } from '@/hooks/useStycke';
import type { KravListFilter } from '@/hooks/useKrav';

import { NavigationTree } from './NavigationTree';
import { KravTableView } from './KravTableView';
import { KravBreadcrumbs } from '@/components/krav/KravBreadcrumbs';

import IsagLogo from '@/assets/IsagLogo.svg';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { PanelLeft, Plus } from 'lucide-react'; // 👉 ADICIÓN: Plus
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // 👉 ADICIÓN: Dialog
import { DelForm } from '../navigationtree/DelForm'; // 👉 ADICIÓN: DelForm

const LS_SELECTED_STYCKE_ID = 'selectedStyckeId';
const LS_KRAV_SCOPE = 'kravScope';
// Persistencia de expansiones para rehidratar tras refresh
const LS_EXP_DEL = 'expandedDelId';
const LS_EXP_AVS = 'expandedAvsnittId';
const LS_EXP_OMR = 'expandedOmradeId';

function readScopeFromLS(): KravListFilter | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KRAV_SCOPE) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      (Object.prototype.hasOwnProperty.call(parsed, 'styckeId') ||
        Object.prototype.hasOwnProperty.call(parsed, 'omradeId') ||
        Object.prototype.hasOwnProperty.call(parsed, 'avsnittId'))
    ) {
      return parsed as KravListFilter;
    }
    return null;
  } catch {
    return null;
  }
}

/** Fuente de verdad única para inicializar el scope (URL > LS). */
function getInitialScope(search: string): KravListFilter | null {
  const params = new URLSearchParams(search);
  const urlStyckeIdStr = params.get('styckeId');
  if (urlStyckeIdStr != null) {
    const id = Number.parseInt(urlStyckeIdStr, 10);
    if (Number.isFinite(id) && id > 0) return { styckeId: id };
  }
  return readScopeFromLS();
}

export const KravTreeAndTable = () => {
  const location = useLocation();

  // Inicialización única desde URL/LS con una sola lectura coherente
  const initialScope = useMemo(() => getInitialScope(location.search), [location.search]);

  // 1) Scope: fuente de la verdad (persistido)
  const [scope, setScope] = useState<KravListFilter | null>(initialScope);

  // 2) selectedStyckeId solo si el scope es stycke (para resaltar en la lista)
  const [selectedStyckeId, setSelectedStyckeId] = useState<number | null>(
    initialScope && 'styckeId' in initialScope && typeof initialScope.styckeId === 'number'
      ? initialScope.styckeId
      : null,
  );

  // Root list (Del)
  const { data: delList = [] } = useDelList();

  // Parents SOLO cuando el scope actual es stycke (para abrir ramas automáticamente)
  const styckeIdForParents =
    scope && 'styckeId' in scope && typeof scope.styckeId === 'number' ? scope.styckeId : null;
  const { data: parentsIds } = useStyckeParents(styckeIdForParents);

  // Estado de expansión rehidratado desde localStorage
  const [expandedDelId, setExpandedDelId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = localStorage.getItem(LS_EXP_DEL);
    return s != null ? Number.parseInt(s, 10) : null;
  });
  const [expandedAvsnittId, setExpandedAvsnittId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = localStorage.getItem(LS_EXP_AVS);
    return s != null ? Number.parseInt(s, 10) : null;
  });
  const [expandedOmradeId, setExpandedOmradeId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = localStorage.getItem(LS_EXP_OMR);
    return s != null ? Number.parseInt(s, 10) : null;
  });

  // Persistir expansiones (si es null, limpiamos la clave)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (expandedDelId == null) localStorage.removeItem(LS_EXP_DEL);
    else localStorage.setItem(LS_EXP_DEL, String(expandedDelId));
  }, [expandedDelId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (expandedAvsnittId == null) localStorage.removeItem(LS_EXP_AVS);
    else localStorage.setItem(LS_EXP_AVS, String(expandedAvsnittId));
  }, [expandedAvsnittId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (expandedOmradeId == null) localStorage.removeItem(LS_EXP_OMR);
    else localStorage.setItem(LS_EXP_OMR, String(expandedOmradeId));
  }, [expandedOmradeId]);

  // Mobile sheet state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // 👉 ADDITION: State of the "Ny del" dialogue
  const [openNewDel, setOpenNewDel] = useState(false);

  // Automatically open branches when scope is Stycke (DOES NOT clear scope; not a user action)
  useEffect(() => {
    if (!parentsIds) return;
    if (parentsIds.delId) setExpandedDelId(parentsIds.delId);
    if (parentsIds.avsnittId) setExpandedAvsnittId(parentsIds.avsnittId);
    if (parentsIds.omradeId) setExpandedOmradeId(parentsIds.omradeId);
  }, [parentsIds]);

  // Handlers
  const handleSelectStycke = useCallback((id: number) => {
    const next: KravListFilter = { styckeId: id };
    setScope(next);
    setSelectedStyckeId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KRAV_SCOPE, JSON.stringify(next));
      localStorage.setItem(LS_SELECTED_STYCKE_ID, String(id));
    }
    setIsMobileNavOpen(false);
    // Las expansiones correctas se abrirán por useStyckeParents y quedarán persistidas
  }, []);

  const handleSelectScope = useCallback((next: KravListFilter) => {
    // Si NO es stycke, limpiamos el highlight persistido de stycke
    if (!('styckeId' in next)) {
      setSelectedStyckeId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LS_SELECTED_STYCKE_ID);
      }
    } else {
      setSelectedStyckeId(next.styckeId!);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_SELECTED_STYCKE_ID, String(next.styckeId!));
      }
    }
    setScope(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KRAV_SCOPE, JSON.stringify(next));
    }
    setIsMobileNavOpen(false);
  }, []);

  /**
   * Al posicionarse en una rama principal (Del) por acción del usuario,
   * mostramos SIEMPRE la pantalla inicial: limpiamos scope y selección.
   * Nota: los auto-expands (useStyckeParents) NO usan este handler.
   */
  const handleExpandDel = useCallback((id: number) => {
    const normalized = id > 0 ? id : null;
    setExpandedDelId(normalized);

    // 👉 Acción del usuario: reseteamos para mostrar pantalla inicial
    setScope(null);
    setSelectedStyckeId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_KRAV_SCOPE);
      localStorage.removeItem(LS_SELECTED_STYCKE_ID);
    }
  }, []);

  // Mantengo la firma de estos (no afectan pantalla inicial)
  const handleExpandAvsnitt = useCallback((id: number) => {
    setExpandedAvsnittId(id > 0 ? id : null);
  }, []);
  const handleExpandOmrade = useCallback((id: number) => {
    setExpandedOmradeId(id > 0 ? id : null);
  }, []);

  // Sincronización con ?styckeId (evita doble set si ya coincide)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const styckeIdStr = params.get('styckeId');
    if (!styckeIdStr) return;

    const id = Number.parseInt(styckeIdStr, 10);
    if (!Number.isFinite(id) || id <= 0) return;

    const isSameScope =
      scope && 'styckeId' in scope && typeof scope.styckeId === 'number' && scope.styckeId === id;
    const isSameSelected = selectedStyckeId === id;

    if (isSameScope && isSameSelected) return; // no-op si ya coincide

    const next: KravListFilter = { styckeId: id };
    setScope(next);
    setSelectedStyckeId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KRAV_SCOPE, JSON.stringify(next));
      localStorage.setItem(LS_SELECTED_STYCKE_ID, String(id));
    }
  }, [location.search, scope, selectedStyckeId]);

  // Breadcrumbs: solo pasan parents cuando scope es stycke
  const styckeParentsForBreadcrumbs = useMemo(() => {
    if (scope && 'styckeId' in scope && typeof scope.styckeId === 'number') {
      return parentsIds ?? null;
    }
    return null;
  }, [scope, parentsIds]);

  const crumbsKey = useMemo(() => {
    if (!scope) return 'none';
    if ('styckeId' in scope) return `stycke-${scope.styckeId}`;
    if ('omradeId' in scope) return `omrade-${scope.omradeId}`;
    return `avsnitt-${scope.avsnittId}`;
  }, [scope]);

  return (
    <div className='flex h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-background to-muted/40 sm:h-[calc(100vh-6rem)]'>
      {/* Desktop Sidebar */}
      <aside
        className='hidden lg:block w-[360px] max-w-[40vw] border-r bg-card/50 backdrop-blur-sm overflow-auto p-3 md:p-4'
        aria-label='Navigationspanel'
      >
        <div className='sticky top-0 z-10 bg-card/70 backdrop-blur-sm -mx-3 md:-mx-4 px-3 md:px-4 py-2'>
          {/* 👉 ADDITION: "Ny del" button aligned with "Navigering" */}
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold tracking-wide text-muted-foreground'>
              Navigering
            </h2>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => setOpenNewDel(true)}
              title='Skapa ny del'
            >
              <Plus className='h-4 w-4' />
              Ny DEL
            </Button>
          </div>
        </div>

        <NavigationTree
          delList={delList}
          selectedStyckeId={selectedStyckeId}
          selectedScope={scope}
          onSelectStycke={handleSelectStycke}
          expandedDelId={expandedDelId}
          expandedAvsnittId={expandedAvsnittId}
          expandedOmradeId={expandedOmradeId}
          onExpandDel={handleExpandDel}
          onExpandAvsnitt={handleExpandAvsnitt}
          onExpandOmrade={handleExpandOmrade}
          onSelectScope={handleSelectScope}
        />
      </aside>

      {/* Main area */}
      <main className='flex-1 overflow-hidden flex flex-col'>
        {/* Top bar */}
        <div className='sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 md:px-4 py-2'>
          <div className='flex items-center gap-2'>
            {/* Mobile open sidebar */}
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild className='lg:hidden'>
                <Button variant='outline' size='icon' aria-label='Öppna navigation'>
                  <PanelLeft className='h-5 w-5' />
                </Button>
              </SheetTrigger>

              <SheetContent side='left' className='w-[85vw] sm:w-[380px] p-0'>
                {/* 👉 ADICIÓN: botón "Ny del" en header del panel móvil */}
                <div className='px-4 pt-4 pb-2 sticky top-0 z-10 bg-background/80 backdrop-blur'>
                  <div className='flex items-center justify-between gap-2'>
                    <SheetHeader className='p-0'>
                      <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-2'
                      onClick={() => setOpenNewDel(true)}
                      title='Skapa ny del'
                    >
                      <Plus className='h-4 w-4' />
                      Ny DEL
                    </Button>
                  </div>
                </div>

                <Separator />
                <div className='h-[calc(100%-3.5rem)] overflow-auto p-3 md:p-4'>
                  {/* Renderiza el árbol solo cuando el sheet está abierto */}
                  {isMobileNavOpen && (
                    <NavigationTree
                      delList={delList}
                      selectedStyckeId={selectedStyckeId}
                      selectedScope={scope}
                      onSelectStycke={handleSelectStycke}
                      expandedDelId={expandedDelId}
                      expandedAvsnittId={expandedAvsnittId}
                      expandedOmradeId={expandedOmradeId}
                      onExpandDel={handleExpandDel}
                      onExpandAvsnitt={handleExpandAvsnitt}
                      onExpandOmrade={handleExpandOmrade}
                      onSelectScope={handleSelectScope}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumbs: solo cuando HAY scope → si no, no se muestra nada */}
            {scope ? (
              <KravBreadcrumbs
                key={crumbsKey}
                scope={scope}
                styckeParents={styckeParentsForBreadcrumbs}
              />
            ) : null}
          </div>
        </div>

        {/* Content area */}
        <div className='flex-1 overflow-auto p-3 md:p-4'>
          {scope ? (
            <div className='rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md'>
              <div className='p-3 md:p-4'>
                {'styckeId' in scope && typeof scope.styckeId === 'number' ? (
                  <KravTableView styckeId={scope.styckeId} />
                ) : (
                  <KravTableView scope={scope} />
                )}
              </div>
            </div>
          ) : (
            <div className='h-full flex flex-col items-center justify-center text-center text-muted-foreground'>
              <img src={IsagLogo} alt='Isag Logo' className='h-38 w-100' />
              <p className='mt-4 max-w-[48ch] text-balance'>
                Välj ett stycke, avsnitt eller område till vänster för att se/kreate deras{' '}
                <span className='font-medium'>Krav</span>.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 👉 ADDITION: Shared dialog (desktop + mobile) with DelForm */}
      <Dialog open={openNewDel} onOpenChange={setOpenNewDel}>
        <DialogContent className='sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Ny DEL</DialogTitle>
          </DialogHeader>
          <DelForm mode='create' onClose={() => setOpenNewDel(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
