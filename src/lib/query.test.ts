// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClientRestore } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { CACHE_MAX_AGE, queryClient } from './query';
import { limpiarFallos, listarFallos } from './fallos';

const DOS_DIAS = 2 * 24 * 60 * 60_000;

/** Un almacenamiento en memoria con la forma de localStorage. */
function memoria(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

describe('la cola de cambios sin señal', () => {
  it('sobrevive a más de un día cerrada: una captura en pausa sigue ahí al restaurar', async () => {
    const storage = memoria();
    const persister = createSyncStoragePersister({ storage, key: 'prueba' });
    storage.setItem('prueba', JSON.stringify({
      buster: '',
      timestamp: Date.now() - DOS_DIAS,
      clientState: {
        queries: [],
        mutations: [{
          mutationKey: ['createItem'],
          state: {
            context: undefined, data: undefined, error: null, failureCount: 1, failureReason: null,
            isPaused: true, status: 'pending', variables: { id: 'abc', title: 'Sin señal' }, submittedAt: Date.now() - DOS_DIAS,
          },
        }],
      },
    }));
    queryClient.getMutationCache().clear();
    await persistQueryClientRestore({ queryClient, persister, maxAge: CACHE_MAX_AGE });
    const enCola = queryClient.getMutationCache().getAll();
    expect(enCola).toHaveLength(1);
    expect(enCola[0].state.isPaused).toBe(true);
    expect(enCola[0].state.variables).toEqual({ id: 'abc', title: 'Sin señal' });
  });

  it('envía los cambios uno tras otro, en orden, nunca a la vez', async () => {
    const qc = new QueryClient();
    const orden: string[] = [];
    const lenta = async (n: number) => {
      orden.push(`inicio ${n}`);
      await new Promise((r) => setTimeout(r, 20));
      orden.push(`fin ${n}`);
      return n;
    };
    const base = queryClient.getMutationDefaults(['updateItem']);
    const cache = qc.getMutationCache();
    const m1 = cache.build(qc, { ...base, mutationKey: ['updateItem'], mutationFn: () => lenta(1) });
    const m2 = cache.build(qc, { ...base, mutationKey: ['updateItem'], mutationFn: () => lenta(2) });
    await Promise.all([m1.execute(undefined), m2.execute(undefined)]);
    expect(orden).toEqual(['inicio 1', 'fin 1', 'inicio 2', 'fin 2']);
  });

  it('un cambio restaurado que la base rechaza queda registrado para avisar', async () => {
    limpiarFallos();
    const qc = new QueryClient();
    const base = queryClient.getMutationDefaults(['createItem']);
    const m = qc.getMutationCache().build(qc, { ...base, mutationKey: ['createItem'], mutationFn: async () => { throw new Error('ciclo'); } });
    await expect(m.execute({ title: 'x' })).rejects.toThrow();
    expect(listarFallos()).toHaveLength(1);
    expect(listarFallos()[0]).toContain('ciclo');
  });
});
