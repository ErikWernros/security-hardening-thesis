/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: App.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines the main application routes and layout.
 * -----------------------------------------------------------
 */
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { UploadExcelPage } from './pages/UploadExcelPage';
import { KravTreeAndTable } from './pages/krav/KravTreeAndTable';
import { BrindProvider } from './components/toast/useBrindToast';

export default function App() {
  return (
    <BrindProvider>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/upload' element={<UploadExcelPage />} />
            <Route path='/navigationtable' element={<KravTreeAndTable />} />
            {/* Here you can add more protected routes */}
          </Route>
        </Route>
      </Routes>
    </BrindProvider>
  );
}
