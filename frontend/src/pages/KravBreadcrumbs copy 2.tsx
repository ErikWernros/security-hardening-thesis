/**
 * Responsive breadcrumbs optimized for mobile.
 * - Compact padding and tighter line-height on small screens.
 * - Truncation with max-width limits per segment to avoid overflow.
 * - Optional `mobileHeightVh` to reserve vertical space in ultra-compact layouts.
 */

// src/pages/KravBreadcrumbs.tsx
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { type KravBreadcrumbsProps } from '@/types/domainTypes';

export const KravBreadcrumbs: React.FC<KravBreadcrumbsProps> = ({
  styckeParents,
  mobileHeightVh,
}) => {
  // Inline style only applied on mobile when mobileHeightVh is provided.
  const mobileStyle =
    typeof mobileHeightVh === 'number' ? { height: `${mobileHeightVh}vh` } : undefined;

  return (
    <nav
      aria-label='Brödsmulor'
      className='
        flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto
        px-2 py-1 leading-tight
        sm:px-3 sm:py-1.5
        md:px-4 md:py-2
      '
      style={mobileStyle}
    >
      {/* Vertical stack: one line per level */}
      <div className='flex flex-col gap-1'>
        {/* Line 1: Del (text wraps; chevron stays in the same line) */}
        <div className='flex items-start gap-1'>
          <span className='min-w-0 whitespace-normal break-words'>
            {/* Show full text, never truncate */}
            {styckeParents?.delKod ?? 'Del'}
            {styckeParents?.delNamn ? ` – ${styckeParents.delNamn}` : ''}
          </span>
          <ChevronRight className='h-4 w-4 shrink-0 opacity-60 mt-0.5' />
        </div>

        {/* Line 2: Avsnitt (text wraps; chevron stays in the same line) */}
        <div className='flex items-start gap-1'>
          <span className='min-w-0 whitespace-normal break-words'>
            {styckeParents?.avsnittKod ?? 'Avsnitt'}
            {styckeParents?.avsnittNamn ? ` – ${styckeParents.avsnittNamn}` : ''}
          </span>
          <ChevronRight className='h-4 w-4 shrink-0 opacity-60 mt-0.5' />
        </div>

        {/* Line 3: Stycke (last item, no chevron) */}
        <div className='flex items-start'>
          <span className='min-w-0 whitespace-normal break-words font-medium text-foreground'>
            {styckeParents?.styckeKod ?? 'Stycke'}
            {styckeParents?.styckeNamn ? ` – ${styckeParents.styckeNamn}` : ''}
          </span>
        </div>
      </div>
    </nav>
  );
};
