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
      <span className='truncate max-w-[40vw] sm:max-w-[30vw] md:max-w-[30vw]'>
        {styckeParents?.delKod ?? 'Del'}
        {styckeParents?.delNamn ? ` – ${styckeParents.delNamn}` : ''}
      </span>
      <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
      <span className='truncate max-w-[40vw] sm:max-w-[30vw] md:max-w-[30vw]'>
        {styckeParents?.avsnittKod ?? 'Avsnitt'}
        {styckeParents?.avsnittNamn ? ` – ${styckeParents.avsnittNamn}` : ''}
      </span>
      <ChevronRight className='h-4 w-4 shrink-0 opacity-60' />
      <span className='truncate max-w-[48vw] sm:max-w-[40vw] md:max-w-[28vw] font-medium text-foreground'>
        {styckeParents?.styckeKod ?? 'Stycke'}
        {styckeParents?.styckeNamn ? ` – ${styckeParents.styckeNamn}` : ''}
      </span>
    </nav>
  );
};
