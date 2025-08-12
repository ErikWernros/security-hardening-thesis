/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: AuthProvider.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines the authentication context provider.
 * It manages the authentication state, including token management,
 * loading state, and provides methods for saving and removing tokens.
 * It uses React's Context API to make authentication state available
 * throughout the application.
 * -----------------------------------------------------------
 */
import { useState, useMemo, useCallback, type ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom'; // We need the router hooks here
import { AuthContext, type AuthContextType } from './authTypes';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // This useEffect is now the ONLY source of truth for initial authentication
  useEffect(() => {
    // 1. Check if there is a token in the URL (comes from the login callback)
    const tokenFromUrl = new URLSearchParams(location.search).get('token');

    if (tokenFromUrl) {
      // If it exists, it is the most recent source of truth. Save it.
      localStorage.setItem('authToken', tokenFromUrl);
      setToken(tokenFromUrl);

      // Clean the URL to remove the token and prevent it from being reused
      navigate(location.pathname, { replace: true });

      // We're done, we're out of the effect
      setIsLoading(false);
      return; // We left early
    }

    // 2. If there is no token in the URL, check localStorage (page refresh case)
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }

    // 3. In any case, we have finished the initial verification.
    setIsLoading(false);
  }, [location.search, location.pathname, navigate]); // Dependencias clave

  // The logout function remains the same
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    queryClient.clear();
    // We force a reload to the home page to clear all state
  }, [queryClient]);

  // The saveToken function is no longer needed for the main flow,
  // but we're keeping it in case you need it elsewhere.
  const saveToken = useCallback((userToken: string) => {
    localStorage.setItem('authToken', userToken);
    setToken(userToken);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      isAuthenticated: !!token,
      isLoading,
      saveToken,
      logout,
    }),
    [token, isLoading, saveToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
