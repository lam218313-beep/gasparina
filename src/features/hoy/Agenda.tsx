import React from 'react';
import { dayOf, fmtDay, fmtHour, todayLima } from '@/lib/dates';
import type { Bucket, Item } from '@/lib/types';
import { Tag } from '@/ui';

export interface AgendaEntry { item: Item; bucket: Bucket }

/**
 * El día como lista vertical: la hora a la izquierda, una línea con el color del área y el título.
 * Lo que vence hoy va al final, con su etiqueta. El orden lo decide la base (today_items).
 */
export const Agenda: React.FC<{ entries: AgendaEntry[] }> = ({ entries }) => {
  if (entries.length === 0) return <p className="m-0 text-[14px] text-text-3">Sin agenda hoy.</p>;
  const hoy = todayLima();
  // Lo que venció antes y sigue abierto se queda en Hoy, con su fecha, hasta que se cierre.
  const etiqueta = (item: Item) => (item.due_at && dayOf(item.due_at) < hoy ? `Venció ${fmtDay(item.due_at)}` : 'Vence hoy');
  return (
    <ul role="list" aria-label="Agenda" className="list-none m-0 p-0 flex flex-col">
      {entries.map(({ item, bucket }) => (
        <li key={item.id} className="flex items-stretch gap-3 py-2">
          <span className="w-12 shrink-0 pt-0.5 text-[13px] font-extrabold text-text-2 tabular-nums">
            {bucket === 'vence' ? '' : item.start_at ? fmtHour(item.start_at) : ''}
          </span>
          <span className="w-1 rounded-full shrink-0" style={{ background: item.area_color ?? '#4A4A55' }} aria-hidden />
          <span className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold leading-snug">{item.title}</span>
            {bucket === 'vence' && <Tag tone="pink">{etiqueta(item)}</Tag>}
            {bucket !== 'vence' && item.duration_min != null && <span className="text-[12px] font-bold text-text-3">{item.duration_min} min</span>}
          </span>
        </li>
      ))}
    </ul>
  );
};
