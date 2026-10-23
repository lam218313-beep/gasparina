/**
 * Los tipos del cerebro, tal como los guarda la base (ver supabase/migrations) y como los usa la app.
 */
import type { Database } from './database.types';

export type ItemStatus = 'bandeja' | 'siguiente' | 'en_curso' | 'esperando' | 'algun_dia' | 'hecho' | 'descartado';
export type ItemKind = 'tarea' | 'proyecto' | 'meta' | 'idea' | 'informe' | 'evento';
export type Importance = 1 | 2 | 3 | 4 | 5;
export type Bucket = 'foco' | 'noche' | 'agenda' | 'vence';

export const STATUSES: ItemStatus[] = ['bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia', 'hecho', 'descartado'];
export const STATUS_LABEL: Record<ItemStatus, string> = {
  bandeja: 'Bandeja', siguiente: 'Siguiente', en_curso: 'En curso', esperando: 'Esperando',
  algun_dia: 'Algún día', hecho: 'Hecho', descartado: 'Descartado',
};

export type Area = Database['public']['Tables']['areas']['Row'];
export type ItemEvent = Database['public']['Tables']['item_events']['Row'];

type VItemRow = Database['public']['Views']['v_items']['Row'];
type Garantizados = 'id' | 'title' | 'status' | 'kind' | 'version' | 'created_at' | 'updated_at' | 'evening' | 'created_by' | 'owner_id';

/**
 * Una fila de v_items. Las vistas de Postgres pierden el NOT NULL, así que aquí se recuperan los
 * campos que la tabla items sí garantiza.
 */
export type Item = Omit<VItemRow, Garantizados> & {
  id: string;
  title: string;
  status: ItemStatus;
  kind: ItemKind;
  version: number;
  created_at: string;
  updated_at: string;
  evening: boolean;
  created_by: string;
  owner_id: string;
};

export interface NewItem {
  id?: string;
  title: string;
  kind?: ItemKind;
  areaId?: string | null;
  parentId?: string | null;
  importance?: Importance | null;
  status?: ItemStatus;
  dueAt?: string | null;
  startAt?: string | null;
  durationMin?: number | null;
  repeatRule?: 'semanal' | null;
  evening?: boolean;
  originSourceId?: string | null;
  originItemId?: string | null;
  body?: string | null;
}

export type ItemPatch = Partial<NewItem> & { focusOn?: string | null; version: number };

export interface ItemFilter {
  status?: ItemStatus[];
  areaId?: string;
  parentId?: string | null;
  kind?: ItemKind[];
}

/** Las seis áreas con las que arranca cada dueño (mismos colores que --color-area-* en styles.css). */
export const DEFAULT_AREAS: { slug: string; name: string; prefix: string; color: string }[] = [
  { slug: 'pixely', name: 'Pixely', prefix: 'PIX', color: '#EB0C6E' },
  { slug: 'trabajo-fijo', name: 'Trabajo fijo', prefix: 'TRA', color: '#3B82F6' },
  { slug: 'trabajos-temporales', name: 'Trabajos temporales', prefix: 'TMP', color: '#F59E0B' },
  { slug: 'universidad', name: 'Universidad', prefix: 'UNI', color: '#8B5CF6' },
  { slug: 'emprendimientos', name: 'Emprendimientos', prefix: 'EMP', color: '#10B981' },
  { slug: 'personal', name: 'Personal', prefix: 'PER', color: '#EC4899' },
];
