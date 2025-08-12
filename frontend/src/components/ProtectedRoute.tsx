/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: ProtectedRoute.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines a ProtectedRoute component that checks
 * if the user is authenticated before allowing access to certain routes.
 * If the user is not authenticated, they are redirected to the login page.
 * If the authentication state is still loading, a loading message is displayed.
 * -----------------------------------------------------------
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. If we're in the initial loading state, we either render nothing or a spinner.
  // This is crucial to avoid premature redirection.
  if (isLoading) {
    return <div>Verifierar autentisering...</div>; // O un componente Spinner
  }

  // 2. If we're not loading anymore and the user is NOT authenticated, we redirect.
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // 3. If we're not loading anymore and the user IS authenticated, we display the content.
  return <Outlet />;
};

/*
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Console.log de diagnóstico
  console.log(
    `ProtectedRoute Renderizado: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}`,
  );

  if (isLoading) {
    console.log('Decisión: Mostrando "Cargando..."');
    return <div>Verificando autenticación...</div>;
  }

  if (!isAuthenticated) {
    console.log('Decisión: Redirigiendo a /login');
    return <Navigate to='/login' replace />;
  }

  console.log('Decisión: Mostrando el contenido (Outlet)');
  return <Outlet />;
};
*/
