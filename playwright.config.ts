/**
 * Pruebas de extremo a extremo: la app real (compilada) en un navegador con tamaño de celular,
 * hablando con el Supabase local (supabase start). Se corren con `npm run test:e2e`.
 * Las pruebas de un mismo archivo van en orden y comparten un usuario nuevo (ver e2e/fixtures.ts).
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4320;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  // Dos archivos a la vez como máximo: con más, el Supabase local y el navegador se quedan sin conexiones.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'block',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'android', use: { ...devices['Pixel 7'] } }],
  webServer: {
    // Siempre una compilación fresca: un servidor viejo podría servir código viejo.
    command: `npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
