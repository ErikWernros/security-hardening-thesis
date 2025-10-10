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
import { useDelAggregate } from '@/hooks/useDel';
import { RadarChart } from '@/components/ui/RadarChart';
import { BarChart } from '@/components/ui/BarChart';
import { KPICards } from '@/components/ui/KPICards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/ui/ExportButton';

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
  const { data: user, isLoading: profileLoading, isError: profileError, error } = useProfile();

  // ✅ NY: Använd aggregate data för diagrammen
  const { data: aggregateData, isLoading: dataLoading, error: dataError } = useDelAggregate();

  if (profileLoading) {
    return <p>Laddar din profilinformation...</p>;
  }

  if (profileError) {
    return <p className='text-destructive'>Error: {error.message}</p>;
  }

  // ✅ Transformera data för komponenterna
  const chartData = aggregateData?.map((item) => ({
    subject: item.del,
    score: item.medelbetyg,
    fullMark: 5,
  }));

  const kpiData = aggregateData
    ? {
        totalaDelomraden: aggregateData.length,
        hogstaBetyg: Math.max(...aggregateData.map((item) => item.medelbetyg)),
        lagstaBetyg: Math.min(...aggregateData.map((item) => item.medelbetyg)),
        genomsnittligBetyg:
          aggregateData.reduce((sum, item) => sum + item.medelbetyg, 0) / aggregateData.length,
        fordelning: {
          hog: aggregateData.filter((item) => item.medelbetyg >= 4).length,
          medel: aggregateData.filter((item) => item.medelbetyg >= 3 && item.medelbetyg < 4).length,
          lag: aggregateData.filter((item) => item.medelbetyg < 3).length,
        },
      }
    : null;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Privat Dashboard</h1>
        <p className='text-muted-foreground'>Detta är ditt säkra område.</p>
      </div>

      {user && (
        <div className='border p-4 rounded-lg'>
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

      {/* ✅ NY: Charts sektion med tabs */}
      <div className='mt-8'>
        <h2 className='text-2xl font-bold mb-4'>Kravtäckningsanalys</h2>

        {dataLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-[400px] w-full' />
          </div>
        ) : dataError ? (
          <p className='text-destructive'>Kunde inte ladda diagramdata: {dataError.message}</p>
        ) : (
          <Tabs defaultValue='radar' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='radar'>Radardiagram</TabsTrigger>
              <TabsTrigger value='bar'>Stapeldiagram</TabsTrigger>
              <TabsTrigger value='kpi'>KPI-kort</TabsTrigger>
            </TabsList>

            <TabsContent value='radar' className='space-y-4'>
              {/* ✅ NY: Export-knapp för radar */}
              <div className='flex justify-end'>
                <ExportButton data={chartData} type='radar' />
              </div>
              <RadarChart data={chartData} />
            </TabsContent>

            <TabsContent value='bar' className='space-y-4'>
              {/* ✅ NY: Export-knapp för bar */}
              <div className='flex justify-end'>
                <ExportButton data={chartData} type='bar' />
              </div>
              <BarChart data={chartData} />
            </TabsContent>

            <TabsContent value='kpi' className='space-y-4'>
              {/* ✅ NY: Export-knapp för kpi */}
              <div className='flex justify-end'>
                <ExportButton data={kpiData} type='kpi' />
              </div>
              {kpiData && <KPICards data={kpiData} />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
