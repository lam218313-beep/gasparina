import React from 'react';
import { fmtDay, fmtHour } from '@/lib/dates';
import type { Json } from '@/lib/database.types';
import type { ItemEvent } from '@/lib/types';

const ACTOR: Record<string, string> = { user: 'Tú', claude: 'Claude', automation: 'Automático', trigger: 'Automático' };
const CAMPO: Record<string, string> = {
  status: 'Estado', importance: 'Importancia', title: 'Título', due_at: 'Fecha límite',
  start_at: 'Inicio', focus_on: 'Para ahora', kind: 'Tipo',
};

function valor(field: string, v: Json | null): string {
  if (v == null) return '—';
  if (field === 'due_at' || field === 'start_at') return `${fmtDay(String(v))} ${fmtHour(String(v))}`;
  return String(v);
}

/** El cambio en palabras: "Estado: bandeja → siguiente", "Importancia: — → 4", "Creado". */
export function describir(e: ItemEvent): string {
  if (e.field === 'creado') return 'Creado';
  if (e.field === 'parent_id') return e.after == null ? 'Padre: ya no cuelga de nada' : e.before == null ? 'Padre: ahora cuelga de otro ítem' : 'Padre: cambió';
  if (e.field === 'area_id') return 'Área: cambió';
  return `${CAMPO[e.field] ?? e.field}: ${valor(e.field, e.before)} → ${valor(e.field, e.after)}`;
}

/** Quién cambió qué y cuándo, lo más reciente primero. */
export const Historial: React.FC<{ events: ItemEvent[] }> = ({ events }) => {
  if (events.length === 0) return <p className="m-0 text-[14px] text-text-3">Sin historial.</p>;
  return (
    <ul role="list" aria-label="Historial" className="list-none m-0 p-0 flex flex-col gap-2.5">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 text-[13px] leading-snug">
          <span className="w-[96px] shrink-0 text-text-3 tabular-nums">{fmtDay(e.at)} {fmtHour(e.at)}</span>
          <span className="flex-1 min-w-0">
            <span className="font-extrabold">{ACTOR[e.actor] ?? e.actor}</span> · {describir(e)}
            {e.note && <span className="block text-text-2">{e.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
};
