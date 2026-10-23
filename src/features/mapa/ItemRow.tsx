import React from 'react';
import { fmtHour } from '@/lib/dates';
import type { Item } from '@/lib/types';
import { ImportanceDots, ListRow, StatusChip } from '@/ui';

/** Una fila de ítem: título, código (y hora si es evento), puntos de importancia y estado. Abre su ficha. */
export const ItemRow: React.FC<{ item: Item }> = ({ item }) => (
  <ListRow
    to={`/mapa/item/${item.id}`}
    title={item.title}
    detail={[item.short_id, item.kind === 'evento' && item.start_at ? fmtHour(item.start_at) : null].filter(Boolean).join(' · ')}
    trailing={
      <span className="flex items-center gap-2 shrink-0">
        <ImportanceDots value={item.effective_importance} />
        <StatusChip status={item.status} />
      </span>
    }
  />
);
