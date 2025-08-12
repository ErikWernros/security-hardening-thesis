/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: Header.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file defines the header component of the application.
 * It includes the application logo, navigation links, and user authentication
 * controls.
 * It also includes a responsive mobile menu using Shadcn UI components.
 * -----------------------------------------------------------
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, UserCircle } from 'lucide-react';
import IsagLogo from '@/assets/IsagLogo.svg';
import { MenubarNav } from './MenubarNav';

export const Header = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { data: user } = useProfile();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className='bg-background/95 backdrop-blur border-b sticky top-0 z-50 shadow-sm'>
      <nav className='container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center'>
        {/* Logo + Name */}
        <NavLink
          to='/'
          className='flex items-center gap-2 text-xl font-semibold hover:text-primary transition-colors'
        >
          <img src={IsagLogo} alt='Isag Logo' className='h-8 w-8' />
          <span>Isag App</span>
        </NavLink>

        {/* Desktop menu */}
        <div className='hidden md:flex items-center gap-6'>
          {user?.role === 'Admin' && (
            <NavLink
              to='/upload'
              className='text-sm font-medium text-muted-foreground hover:text-primary transition-colors'
            >
              Ladda upp Excel
            </NavLink>
          )}

          {isAuthenticated && user ? (
            <>
              <span className='text-sm text-muted-foreground'>
                Välkommen, {user.displayName || user.email}
              </span>
              <Button onClick={handleLogout} variant='destructive' size='sm'>
                Logga ut
              </Button>
            </>
          ) : (
            <Button asChild size='sm'>
              <a href='/api/login'>Logga in</a>
            </Button>
          )}
        </div>

        {/* Mobile menu */}
        <div className='md:hidden'>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Menu className='h-6 w-6' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-64'>
              <div className='flex flex-col gap-6 pt-10'>
                {/* MenubarNav Authenticated ONLY */}
                {!isLoading && isAuthenticated && (
                  <div className='mb-2'>
                    <MenubarNav />
                  </div>
                )}
                {isAuthenticated && user ? (
                  <>
                    <div className='flex items-center gap-3 border-b pb-4'>
                      <UserCircle className='h-8 w-8 text-muted-foreground' />
                      <div>
                        <p className='font-semibold text-base'>{user.displayName}</p>
                        <p className='text-xs text-muted-foreground'>{user.email}</p>
                      </div>
                    </div>
                    {user.role === 'Admin' && (
                      <NavLink
                        to='/upload'
                        className='text-sm font-medium text-muted-foreground hover:text-primary'
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Ladda upp Excel
                      </NavLink>
                    )}
                    <Button onClick={handleLogout} variant='destructive' className='w-full'>
                      Logga ut
                    </Button>
                  </>
                ) : (
                  <Button asChild className='w-full'>
                    <a href='/api/login'>Logga in</a>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {/* MenubarNav: ONLY after authentication and ONLY on desktop */}
      {!isLoading && isAuthenticated && (
        <div className='hidden md:block border-t bg-muted'>
          <MenubarNav className='max-w-5xl mx-auto px-4' />
        </div>
      )}
    </header>
  );
};
