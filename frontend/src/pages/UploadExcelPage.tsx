// src/pages/UploadExcelPage.tsx

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
//import axios from '@/lib/axios';
import { apiClient } from '@/lib/axios';
import { useProfile } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';

// Ruta al backend desde apiRoutes.ts
const UPLOAD_URL = '/api/data/import';

export const UploadExcelPage = () => {
  const { data: user } = useProfile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return;
      const formData = new FormData();
      formData.append('file', selectedFile);
      await apiClient.post(UPLOAD_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  });

  // Si el usuario no es Admin, no mostrar esta vista
  if (user?.role !== 'Admin') {
    return (
      <div className='text-center text-muted-foreground'>
        Du har inte behörighet att komma åt denna sida.
      </div>
    );
  }

  return (
    <div className='max-w-xl mx-auto mt-10 px-4'>
      <h1 className='text-2xl font-bold mb-4'>Ladda upp Excel-fil</h1>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='file'>Välj en .xlsx-fil</Label>
          <Input
            id='file'
            type='file'
            accept='.xlsx'
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button onClick={() => mutate()} disabled={!selectedFile || isPending} className='w-full'>
          {isPending ? 'Laddar upp...' : 'Ladda upp'}
        </Button>

        {isSuccess && <p className='text-green-600 text-sm'>Filen har laddats upp!</p>}
        {isError && <p className='text-red-600 text-sm'>Fel vid uppladdning. Försök igen.</p>}
      </div>
    </div>
  );
};
