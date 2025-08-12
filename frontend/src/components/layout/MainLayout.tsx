/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: MainLayout.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines the main layout of the application.
 * It includes the header and a main content area where routes will be rendered.
 * -----------------------------------------------------------
 */
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const MainLayout = () => {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto p-6'>
        <Outlet />
      </main>
    </div>
  );
};
