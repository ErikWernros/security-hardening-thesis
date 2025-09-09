import type React from 'react';
// -------------------------------------
// Backend shapes (strict, no 'any')
// -------------------------------------
export interface NodeBasic {
  id: number;
  kod: string;
  namn: string;
}
export interface RawParents {
  delId: number;
  avsnittId: number;
}

export interface Del {
  id: number;
  kod: string;
  namn: string;
}

export interface Avsnitt {
  id: number;
  kod: string;
  namn: string;
  delId: number;
}

export interface Stycke {
  id: number;
  kod: string;
  namn: string;
  avsnittId: number;
}

export interface Krav {
  id: number;
  kod: string;
  kravText: string;
  anvisning?: string;
  styckeId: number;
  svar?: Svar;
}

export interface Svar {
  betyg: number | null;
  jaNej: boolean | null;
  verifikat: string;
  kommentar: string;
}

export interface SvarInput {
  betyg: number | null;
  jaNej: boolean | null;
  verifikat: string;
  kommentar: string;
}

export interface BrindCtx {
  showSuccess: (message: string, timeout?: number) => void;
  showWarning: (message: string, timeout?: number) => void;
  showError: (message: string, timeout?: number) => void;
}

// Types aligned with your domain
export interface CreateKravDTO {
  styckeId: number;
  kod: string;
  kravText: string;
  anvisning: string;
}

export interface BackendError {
  code?: string;
  field?: string;
  message?: string;
}

export interface KravBreadcrumbsProps {
  // Keep the original shape; we don't rename fields used in the app.
  styckeParents:
    | {
        delKod?: string;
        delNamn?: string;
        avsnittKod?: string;
        avsnittNamn?: string;
        styckeKod?: string;
        styckeNamn?: string;
      }
    | null
    | undefined;

  /**
   * Optional: Customize mobile height in viewport units when needed (e.g., 70–80vh).
   * If not provided, the component uses natural height with compact padding on mobile.
   * NOTE: This prop is additive and does not rename or alter any existing identifier.
   */
  mobileHeightVh?: number;
}
