/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: types.ts
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines the types for the authentication context.
 * It includes the interface for the AuthContext and its type.
 * -----------------------------------------------------------
 */
import { createContext } from 'react';

// 1. We define the interface (the "contract") of the context
export interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  saveToken: (userToken: string) => void;
  logout: () => void;
}

// 2. We create and export the Context object here
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
