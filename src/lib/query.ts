/**
 * La memoria de corto plazo de la app: lo que una pantalla ya cargó se muestra al instante al
 * volver y se refresca en silencio. Se guarda en el celular (localStorage) para que la app abra
 * con datos aunque no haya señal.
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const DIA = 24 * 60 * 60_000;

/** Un error de red (sin señal, servidor caído) se reintenta; un error de la base (por ejemplo "ciclo") no. */
export const esErrorDeRed = (error: unknown): boolean =>
  error instanceof Error && /fetch|network|sin conexión/i.test(error.message);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: DIA,
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: (count, error) => count < 2 && esErrorDeRed(error),
    },
  },
});

export const persister = createSyncStoragePersister({ storage: window.localStorage, key: 'cerebro-cache' });

/** Cuánto vale la caché guardada antes de descartarla (un día). */
export const CACHE_MAX_AGE = DIA;
