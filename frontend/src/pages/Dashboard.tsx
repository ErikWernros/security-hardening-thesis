/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: Dashboard.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file implements the dashboard page for authenticated users.
 * It retrieves the user's profile information and displays it.
 * The page is protected and can only be accessed after a successful login.
 * -----------------------------------------------------------
 */
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/api/auth';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { saveToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Capture the URL token if it exists (after the backend callback)
  useEffect(() => {
    const tokenFromUrl = new URLSearchParams(location.search).get('token');
    if (tokenFromUrl) {
      saveToken(tokenFromUrl);
      // Clean the URL to not leave the token visible
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate, saveToken]);

  // Use TanStack Query to get the profile data
  const { data: user, isLoading, isError, error } = useProfile();

  if (isLoading) {
    <p>Laddar din profilinformation...</p>;
  }

  if (isError) {
    return <p className='text-destructive'>Error: {error.message}</p>;
  }

  return (
    <div>
      <h1 className='text-3xl font-bold'>Privat Dashboard</h1>
      <p className='text-muted-foreground'>Detta är ditt säkra område.</p>
      {user && (
        <div className='mt-6 border p-4 rounded-lg'>
          <h2 className='text-xl font-semibold'>Din profil</h2>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Namn:</strong> {user.displayName}
          </p>
          <p>
            <strong>Role:</strong>{' '}
            <span className='font-mono bg-primary/10 text-primary p-1 rounded'>{user.role}</span>
          </p>
        </div>
      )}
    </div>
  );
};
