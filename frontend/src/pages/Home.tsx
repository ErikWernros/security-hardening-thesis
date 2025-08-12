/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: Home.tsx
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file implements the home page of the application.
 * It serves as a welcome page and prompts users to log in to access their
 * dashboard.
 * -----------------------------------------------------------
 */
export const Home = () => {
  return (
    <div className='text-center'>
      <h1 className='text-4xl font-bold'>Välkommen till startsidan</h1>
      <p className='mt-4 text-muted-foreground'>Logga in för att komma åt din dashboard.</p>
    </div>
  );
};
