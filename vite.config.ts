/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// La app vive en la raíz (la abre Capacitor en el celular): no hay base ni PWA.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  // Las unitarias viven junto al código (*.test.ts); las de extremo a extremo (e2e/*.spec.ts) son de Playwright.
  // Las unitarias no hablan con Supabase, pero el cliente se crea al importar la capa de datos y exige sus variables.
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'llave-de-prueba-unitaria' },
  },
});
