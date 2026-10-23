/**
 * Los hooks que usan las pantallas. Cada consulta tiene su clave; cada cambio invalida lo que toca.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createItem, getItem, listAreas, listEvents, listItems, projectProgress, todayItems, updateItem } from './cerebro';
import type { Item, ItemFilter, ItemPatch, NewItem } from './types';

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

/** Lo que cambia en pantalla al instante, antes de que la base confirme. */
function optimistic(item: Item, patch: ItemPatch): Item {
  const next: Item = { ...item, version: item.version + 1 };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.importance !== undefined) next.importance = patch.importance;
  if (patch.areaId !== undefined) next.area_id = patch.areaId;
  if (patch.parentId !== undefined) next.parent_id = patch.parentId;
  if (patch.dueAt !== undefined) next.due_at = patch.dueAt;
  if (patch.startAt !== undefined) next.start_at = patch.startAt;
  if (patch.durationMin !== undefined) next.duration_min = patch.durationMin;
  if (patch.evening !== undefined) next.evening = patch.evening;
  if (patch.body !== undefined) next.body = patch.body;
  if (patch.focusOn !== undefined) next.focus_on = patch.focusOn;
  return next;
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['createItem'],
    mutationFn: (input: NewItem) => createItem(input),
    onSettled: (data) => {
      void qc.invalidateQueries({ queryKey: ['items'] });
      void qc.invalidateQueries({ queryKey: ['today'] });
      void qc.invalidateQueries({ queryKey: ['progress'] });
      if (data) {
        void qc.invalidateQueries({ queryKey: keys.item(data.id) });
        void qc.invalidateQueries({ queryKey: keys.events(data.id) });
      }
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['updateItem'],
    mutationFn: ({ id, patch }: { id: string; patch: ItemPatch }) => updateItem(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: keys.item(id) });
      const prev = qc.getQueryData<Item>(keys.item(id));
      if (prev) qc.setQueryData<Item>(keys.item(id), optimistic(prev, patch));
      return { prev };
    },
    onError: (_error, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.item(id), ctx.prev);
    },
    onSettled: (_data, _error, { id }) => {
      void qc.invalidateQueries({ queryKey: ['items'] });
      void qc.invalidateQueries({ queryKey: ['today'] });
      void qc.invalidateQueries({ queryKey: ['progress'] });
      void qc.invalidateQueries({ queryKey: keys.item(id) });
      void qc.invalidateQueries({ queryKey: keys.events(id) });
    },
  });
}
