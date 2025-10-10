import * as React from 'react';
import { memo, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { type KravBreadcrumbsProps, type RawParents } from '@/types/domainTypes';
import type { KravListFilter } from '@/hooks/useKrav';
import { useKravBreadcrumbSegments } from '@/hooks/kravbreadcrumbs/useBreadcrumbs';

type Segment = { label: string };

type Props = KravBreadcrumbsProps & {
  /** Current scope (Section | Area | Paragraph) — comes from RequirementsTreeAndTable */
  scope: KravListFilter | null;
  /** optional hint to speed up the stycke case */
  styckeParents?: RawParents | null;
};

/**
 * Module-level GLOBAL cache: survives remounts caused by `key={crumbsKey}`.
 * Avoids the "empty frame" by displaying the last valid breadcrumb immediately,
 * until the hook delivers the segments for the new scope.
 */
let __KRAV_BC_LAST_SEGMENTS__: Segment[] = [];

/**
 * KravBreadcrumbs
 * - Mobile: vertical list (one line per segment)
 * - Desktop: horizontal with chevrons, with truncation and title
 * - Anti-flicker: use global fallback on the first frame after remount
 */
export const KravBreadcrumbs = memo(({ mobileHeightVh, scope, styckeParents }: Props) => {
  // Keep last stable local value, initialized from the global cache (survives remount)
  const lastNonEmpty = useRef<Segment[]>(
    Array.isArray(__KRAV_BC_LAST_SEGMENTS__) ? __KRAV_BC_LAST_SEGMENTS__ : [],
  );

  const segmentsFromHook =
    useKravBreadcrumbSegments(scope, { styckeParentsHint: styckeParents ?? undefined }) ?? null;

  // We prefer hook segments if they exist; otherwise, we use the latest stable one (local/global)
  const segments: Segment[] =
    Array.isArray(segmentsFromHook) && segmentsFromHook.length > 0
      ? segmentsFromHook
      : lastNonEmpty.current;

  // When new segments arrive, we update the local ref and the global cache
  if (Array.isArray(segmentsFromHook) && segmentsFromHook.length > 0) {
    lastNonEmpty.current = segmentsFromHook;
    __KRAV_BC_LAST_SEGMENTS__ = segmentsFromHook;
  }

  // If there were never any segments (first render of the entire app), we don't render anything
  if (segments.length === 0) return null;

  const mobileStyle =
    typeof mobileHeightVh === 'number' ? { height: `${mobileHeightVh}vh` } : undefined;

  return (
    <nav
      aria-label='Brödsmulor'
      className='flex text-sm text-muted-foreground px-2 py-1 leading-tight sm:px-3 sm:py-1.5 md:px-4 md:py-2'
      style={mobileStyle}
    >
      {/* Mobile: one line per segment */}
      <div className='sm:hidden flex flex-col gap-1 w-full'>
        {segments.map((seg, idx) => (
          <div key={`${seg.label}-${idx}`} className='flex items-start gap-1'>
            <span className={idx === segments.length - 1 ? 'font-medium text-foreground' : ''}>
              {seg.label}
            </span>
            {idx < segments.length - 1 ? (
              <ChevronRight className='h-4 w-4 shrink-0 opacity-60 mt-0.5' />
            ) : null}
          </div>
        ))}
      </div>

      {/* Desktop: horizontal with chevrons and truncated */}
      <div className='hidden sm:flex items-center gap-1 overflow-x-auto w-full'>
        {segments.map((seg, idx) => (
          <React.Fragment key={`${seg.label}-${idx}`}>
            <span
              className={[
                'truncate',
                idx === segments.length - 1 ? 'font-medium text-foreground' : '',
                idx === 0
                  ? 'max-w-[15vw] sm:max-w-[10vw] md:max-w-[10vw]'
                  : 'max-w-[20vw] sm:max-w-[15vw] md:max-w-[15vw]',
              ].join(' ')}
              title={seg.label}
            >
              {seg.label}
            </span>
            {idx < segments.length - 1 ? (
              <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
});

KravBreadcrumbs.displayName = 'KravBreadcrumbs';

export default KravBreadcrumbs;
