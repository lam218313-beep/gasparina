/**
 * Los hooks que usan las pantallas. Cada consulta tiene su clave; cada cambio invalida lo que toca y,
 * antes de que la base conteste, se refleja en las listas que ya están en pantalla (optimista): así
 * la app responde igual con o sin señal.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { createItem, getItem, listAreas, listEvents, listItems, projectProgress, todayItems, updateItem } from './cerebro';
import { MUTATION_SCOPE } from './query';
import type { Bucket, Item, ItemFilter, ItemPatch, NewItem } from './types';

export interface HoyEntry { item: Item; bucket: Bucket }

export const keys = {
  areas: ['areas'] as const,
  items: (filter: ItemFilter) => ['items', filter] as const,
  item: (id: string) => ['item', id] as const,
  events: (id: string) => ['events', id] as const,
  today: (day: string) => ['today', day] as const,
  progress: (id: string) => ['progress', id] as const,
};

export function useProjectProgress(id: string) {
  return useQuery({ queryKey: keys.progress(id), queryFn: () => projectProgress(id) });
}

export function useAreas() {
  return useQuery({ queryKey: keys.areas, queryFn: listAreas });
}

export function useItems(filter: ItemFilter) {
  return useQuery({ queryKey: keys.items(filter), queryFn: () => listItems(filter) });
}

export function useItem(id: string | undefined) {
  return useQuery({ queryKey: keys.item(id ?? ''), queryFn: () => getItem(id!), enabled: !!id });
}

export function useEvents(id: string | undefined) {
  return useQuery({ queryKey: keys.events(id ?? ''), queryFn: () => listEvents(id!), enabled: !!id });
}

export function useToday(day: string) {
  return useQuery({ queryKey: keys.today(day), queryFn: () => todayItems(day) });
}

// ---------------------------------------------------------------------------
// Lo optimista: cómo se ve un cambio en pantalla antes de que la base lo confirme
// ---------------------------------------------------------------------------

/** Un ítem recién capturado antes de que la base lo confirme (sin código corto todavía). */
function provisional(input: NewItem, id: string): Item {
  const now = new Date().toISOString();
  return {
    id, owner_id: '', title: input.title.trim(), kind: input.kind ?? 'tarea', status: input.status ?? 'bandeja',
    body: input.body ?? null, area_id: input.areaId ?? null, parent_id: input.parentId ?? null,
    origin_item_id: input.originItemId ?? null, origin_source_id: input.originSourceId ?? null,
    importance: input.importance ?? null, due_at: input.dueAt ?? null, start_at: input.startAt ?? null,
    duration_min: input.durationMin ?? null, repeat_rule: input.repeatRule ?? null, evening: input.evening ?? false,
    focus_on: null, external_ref: null, short_id: null, seq: null, created_by: 'user', version: 1,
    created_at: now, updated_at: now, done_at: null,
    effective_area_id: input.areaId ?? null, effective_importance: input.importance ?? null,
    path: null, area_slug: null, area_color: null,
  };
}

/** El ítem con el cambio aplicado. */
function optimistic(item: Item, patch: ItemPatch): Item {
  const next: Item = { ...item, version: item.version + 1 };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.importance !== undefined) { next.importance = patch.importance; next.effective_importance = patch.importance ?? next.effective_importance; }
  if (patch.areaId !== undefined) { next.area_id = patch.areaId; next.effective_area_id = patch.areaId ?? next.effective_area_id; }
  if (patch.parentId !== undefined) next.parent_id = patch.parentId;
  if (patch.dueAt !== undefined) next.due_at = patch.dueAt;
  if (patch.startAt !== undefined) next.start_at = patch.startAt;
  if (patch.durationMin !== undefined) next.duration_min = patch.durationMin;
  if (patch.evening !== undefined) next.evening = patch.evening;
  if (patch.body !== undefined) next.body = patch.body;
  if (patch.focusOn !== undefined) next.focus_on = patch.focusOn;
  return next;
}

/** ¿Este ítem entra en la lista que pidió este filtro? (la misma regla que listItems, pero en memoria) */
function coincide(filter: ItemFilter, item: Item): boolean {
  if (filter.status && !filter.status.includes(item.status)) return false;
  if (filter.kind && !filter.kind.includes(item.kind)) return false;
  if (filter.areaId !== undefined && item.effective_area_id !== filter.areaId) return false;
  if (filter.parentId === null && item.parent_id !== null) return false;
  if (typeof filter.parentId === 'string' && item.parent_id !== filter.parentId) return false;
  return true;
}

interface Foto { item?: Item; listas: [QueryKey, Item[] | undefined][]; hoy: [QueryKey, HoyEntry[] | undefined][] }

function foto(qc: QueryClient, id?: string): Foto {
  return {
    item: id ? qc.getQueryData<Item>(keys.item(id)) : undefined,
    listas: qc.getQueriesData<Item[]>({ queryKey: ['items'] }),
    hoy: qc.getQueriesData<HoyEntry[]>({ queryKey: ['today'] }),
  };
}

function restaurar(qc: QueryClient, f: Foto, id?: string) {
  if (id && f.item) qc.setQueryData(keys.item(id), f.item);
  for (const [key, data] of f.listas) qc.setQueryData(key, data);
  for (const [key, data] of f.hoy) qc.setQueryData(key, data);
}

function enListas(qc: QueryClient, fn: (lista: Item[], filtro: ItemFilter) => Item[]) {
  for (const [key, data] of qc.getQueriesData<Item[]>({ queryKey: ['items'] })) {
    if (!data) continue;
    qc.setQueryData<Item[]>(key, fn(data, (key[1] ?? {}) as ItemFilter));
  }
}

function invalidar(qc: QueryClient, id?: string) {
  void qc.invalidateQueries({ queryKey: ['items'] });
  void qc.invalidateQueries({ queryKey: ['today'] });
  void qc.invalidateQueries({ queryKey: ['progress'] });
  if (id) {
    void qc.invalidateQueries({ queryKey: keys.item(id) });
    void qc.invalidateQueries({ queryKey: keys.events(id) });
  }
}

// ---------------------------------------------------------------------------
// Los cambios
// ---------------------------------------------------------------------------

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['createItem'],
    scope: MUTATION_SCOPE,
    mutationFn: (input: NewItem) => createItem(input),
    // Si quien captura ya puso el id, lo nuevo aparece al instante en cada lista donde encaja.
    onMutate: (input) => {
      const f = foto(qc);
      if (input.id) {
        const nuevo = provisional(input, input.id);
        enListas(qc, (lista, filtro) => coincide(filtro, nuevo) ? [...lista.filter((i) => i.id !== nuevo.id), nuevo] : lista);
      }
      return f;
    },
    onError: (_error, _input, f) => { if (f) restaurar(qc, f); },
    onSettled: (data) => invalidar(qc, data?.id),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['updateItem'],
    scope: MUTATION_SCOPE,
    mutationFn: ({ id, patch }: { id: string; patch: ItemPatch }) => updateItem(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.item(id) });
      const f = foto(qc, id);
      const base = f.item
        ?? f.listas.flatMap(([, d]) => d ?? []).find((i) => i.id === id)
        ?? f.hoy.flatMap(([, d]) => (d ?? []).map((e) => e.item)).find((i) => i.id === id);
      if (base) {
        const next = optimistic(base, patch);
        if (f.item) qc.setQueryData<Item>(keys.item(id), next);
        enListas(qc, (lista, filtro) => {
          if (!lista.some((i) => i.id === id)) return lista;
          return coincide(filtro, next) ? lista.map((i) => (i.id === id ? next : i)) : lista.filter((i) => i.id !== id);
        });
        for (const [key, data] of f.hoy) {
          if (!data) continue;
          qc.setQueryData<HoyEntry[]>(key, data.flatMap((e) => {
            if (e.item.id !== id) return [e];
            if (next.status === 'hecho' || next.status === 'descartado') return [];
            if (e.bucket === 'foco' && next.focus_on !== key[1]) return [];
            return [{ ...e, item: next }];
          }));
        }
      }
      return f;
    },
    onError: (_error, { id }, f) => { if (f) restaurar(qc, f, id); },
    onSettled: (_data, _error, { id }) => invalidar(qc, id),
  });
}
