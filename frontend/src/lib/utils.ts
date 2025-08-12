/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: utils.ts
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file contains utility functions for the ISAG AB project.
 * It includes a function to merge class names using clsx and tailwind-merge.
 * -----------------------------------------------------------
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
