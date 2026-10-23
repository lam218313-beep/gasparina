/**
 * La única puerta a los datos del cerebro. Las pantallas no hablan con Supabase: hablan con estas
 * funciones, que saben de tablas, vistas y mensajes de error en palabras simples.
 */
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Database } from './database.types';
import {
  DEFAULT_AREAS,
  type Area, type Bucket, type Item, type ItemEvent, type ItemFilter, type ItemPatch, type NewItem,
} from './types';

type ItemsUpdate = Database['public']['Tables']['items']['Update'];

const ORDEN_AREAS = DEFAULT_AREAS.map((a) => a.prefix);

/** Qué le decimos a la persona cuando la base rechaza algo. */
function mensaje(error: PostgrestError | { message: string }): string {
  if (/\bciclo\b/.test(error.message)) return 'No puede quedar dentro de sí mismo';
  if (/demasiada profundidad/.test(error.message)) return 'Demasiados niveles: no puede ir más adentro';
  if (/fetch|network/i.test(error.message)) return 'Sin conexión. Revisa tu internet.';
  return error.message;
}

function rank(area: Area): number {
  const i = ORDEN_AREAS.indexOf(area.prefix);
  return i === -1 ? ORDEN_AREAS.length : i;
}

export async function listAreas(): Promise<Area[]> {
  const { data, error } = await supabase.from('areas').select('*');
  if (error) throw new Error(mensaje(error));
  return [...data].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'es'));
}

/** Crea las seis áreas iniciales si el dueño todavía no tiene ninguna. Se puede llamar las veces que sea. */
export async function ensureDefaultAreas(): Promise<Area[]> {
  const existing = await listAreas();
  if (existing.length > 0) return existing;
  const { error } = await supabase.from('areas').insert(DEFAULT_AREAS);
  // 23505 = ya existían (otra pantalla las creó un instante antes): no pasa nada.
  if (error && error.code !== '23505') throw new Error(mensaje(error));
  return listAreas();
}

export async function listItems(filter: ItemFilter = {}): Promise<Item[]> {
  let q = supabase.from('v_items').select('*');
  if (filter.status?.length) q = q.in('status', filter.status);
  if (filter.kind?.length) q = q.in('kind', filter.kind);
  if (filter.areaId) q = q.eq('effective_area_id', filter.areaId);
  if (filter.parentId === null) q = q.is('parent_id', null);
  else if (filter.parentId) q = q.eq('parent_id', filter.parentId);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw new Error(mensaje(error));
  return data as Item[];
}

export async function getItem(id: string): Promise<Item> {
  const { data, error } = await supabase.from('v_items').select('*').eq('id', id).single();
  if (error) throw new Error(mensaje(error));
  return data as Item;
}

/** De los nombres de la app (camelCase) a las columnas de la base; solo lo que viene definido. */
function toRow(input: Partial<NewItem>): ItemsUpdate {
  const row: ItemsUpdate = {};
  if (input.title !== undefined) row.title = input.title.trim();
  if (input.kind !== undefined) row.kind = input.kind;
  if (input.areaId !== undefined) row.area_id = input.areaId;
  if (input.parentId !== undefined) row.parent_id = input.parentId;
  if (input.importance !== undefined) row.importance = input.importance;
  if (input.status !== undefined) row.status = input.status;
  if (input.dueAt !== undefined) row.due_at = input.dueAt;
  if (input.startAt !== undefined) row.start_at = input.startAt;
  if (input.durationMin !== undefined) row.duration_min = input.durationMin;
  if (input.repeatRule !== undefined) row.repeat_rule = input.repeatRule;
  if (input.evening !== undefined) row.evening = input.evening;
  if (input.originSourceId !== undefined) row.origin_source_id = input.originSourceId;
  if (input.originItemId !== undefined) row.origin_item_id = input.originItemId;
  if (input.body !== undefined) row.body = input.body;
  return row;
}

/** El id lo pone el cliente: así un envío repetido (sin señal, reintento) no duplica el ítem. */
export async function createItem(input: NewItem): Promise<Item> {
  const id = input.id ?? crypto.randomUUID();
  const { error } = await supabase.from('items').insert({ id, ...toRow(input), title: input.title.trim() });
  if (error) throw new Error(mensaje(error));
  return getItem(id);
}

/** Cambia solo lo que viene en `patch`, y solo si nadie cambió el ítem desde que se leyó (`version`). */
export async function updateItem(id: string, patch: ItemPatch): Promise<Item> {
  const { version, focusOn, ...rest } = patch;
  const row: ItemsUpdate = { ...toRow(rest), ...(focusOn !== undefined ? { focus_on: focusOn } : {}) };
  const { data, error } = await supabase.from('items').update(row).eq('id', id).eq('version', version).select('id');
  if (error) throw new Error(mensaje(error));
  if (!data || data.length === 0) throw new Error('version');
  return getItem(id);
}

export async function listEvents(itemId: string): Promise<ItemEvent[]> {
  const { data, error } = await supabase.from('item_events').select('*').eq('item_id', itemId).order('at', { ascending: false });
  if (error) throw new Error(mensaje(error));
  return data;
}

/** Lo de la pantalla Hoy, en el orden que decide la base (foco, noche, agenda, vence). */
export async function todayItems(day: string): Promise<{ item: Item; bucket: Bucket }[]> {
  const { data: rows, error } = await supabase.rpc('today_items', { p_day: day });
  if (error) throw new Error(mensaje(error));
  if (rows.length === 0) return [];
  const { data: items, error: e2 } = await supabase.from('v_items').select('*').in('id', rows.map((r) => r.item_id));
  if (e2) throw new Error(mensaje(e2));
  const byId = new Map((items as Item[]).map((i) => [i.id, i]));
  return rows.flatMap((r) => {
    const item = byId.get(r.item_id);
    return item ? [{ item, bucket: r.bucket as Bucket }] : [];
  });
}

export async function projectProgress(id: string): Promise<{ done: number; total: number }> {
  const { data, error } = await supabase.rpc('project_progress', { p_item: id });
  if (error) throw new Error(mensaje(error));
  return data[0] ?? { done: 0, total: 0 };
}
