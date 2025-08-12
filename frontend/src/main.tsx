/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: main.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file is the entry point for the React application.
 * -----------------------------------------------------------
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthProvider';
import App from './App.tsx';
import './index.css';

// Create an instance of QueryClient
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap the app with the QueryClientProvider */}
      <QueryClientProvider client={queryClient}>
        {/* Wrap the app with the AuthProvider */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
