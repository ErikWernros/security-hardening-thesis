/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: auth.ts
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines the API client for authentication.
 * It includes functions to get the user profile and manage authentication state.
 * -----------------------------------------------------------
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
// Import the authentication hook to know the status
import { useAuth } from '@/hooks/useAuth';
// IMPORTANT! We import the types directly from the backend project.
// This requires that your tsconfig.json be configured to allow it.
// Make sure the relative paths are correct.

import type { UserPayload } from '../../../backend/src/types';

interface ProfileResponse {
  user: UserPayload;
}

const getProfile = async (): Promise<UserPayload> => {
  const { data } = await apiClient.get<ProfileResponse>('/api/profile');
  return data.user;
};

// Custom hook that wraps TanStack Query
export const useProfile = () => {
  // We get the token directly from our React global state
  const { token } = useAuth();

  return useQuery({
    // The query key now includes the token.
    // This is good practice: if the token changes, the query is considered different.
    queryKey: ['profile', token],
    queryFn: getProfile,
    // THE SOLUTION: The query only fires if the token exists in our React state.
    // This eliminates the state race.
    enabled: !!token,
    retry: false, // It is better not to retry in case of 401/403
    refetchOnWindowFocus: false, // Avoid unnecessary refetching when switching tabs
  });
};
