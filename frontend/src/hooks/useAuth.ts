/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: useAuth.ts
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines a custom hook for accessing authentication context.
 * It provides a way to access the authentication state and methods
 * throughout the application.
 * -----------------------------------------------------------
 */
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authTypes';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth måste användas inom en AuthProvider');
  }
  return context;
};
