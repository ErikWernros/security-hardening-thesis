/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: Login.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file implements the login page for development purposes.
 * It allows users to simulate a login by entering their email, username, and role.
 * The form submits the data to the backend and saves the token for authenticated
 * routes.
 * -----------------------------------------------------------
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/axios';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Login = () => {
  const navigate = useNavigate();
  const { saveToken } = useAuth();

  // States to control the form and feedback to the user
  const [email, setEmail] = useState('admin@test.com');
  const [displayName, setDisplayName] = useState('Admin User');
  const [role, setRole] = useState('Admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form submission handler
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevents form page reloading
    setIsLoading(true);
    setError(null);

    try {
      // Send the data to the backend as JSON using our Axios client
      const response = await apiClient.post<{ token: string }>('/api/dev/auth/callback', {
        email,
        displayName,
        role,
      });

      // If the request is successful, save the token and redirect
      saveToken(response.data.token);
      //navigate('/dashboard');
      navigate('/navigationtable');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Login (Development)</CardTitle>
          <CardDescription>Simulera en inloggning för att testa applikationen.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* The form now calls our handleSubmit function */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor='displayName'>Username</Label>
              <Input
                id='displayName'
                name='displayName'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='role'>Role</Label>
              {/* Shadcn's Select component now handles the 'role' state */}
              <Select name='role' value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Admin'>Admin</SelectItem>
                  <SelectItem value='Assessor'>Assessor</SelectItem>
                  <SelectItem value='Viewer'>Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Simulate Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
