import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5001,
    proxy: {
      // Cualquier petición del frontend que empiece con '/api'
      // será redirigida al servidor del backend en http://localhost:3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true, // Esencial para que el proxy funcione correctamente
      },
    },
  },
});
