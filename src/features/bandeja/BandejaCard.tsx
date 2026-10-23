import React, { useState } from 'react';
import { useAreas, useUpdateItem } from '@/lib/queries';
import type { Importance, Item, ItemStatus } from '@/lib/types';
import { AreaPicker, Button, Card, ImportanceDots } from '@/ui';

/**
 * Una cosa capturada, por ordenar: elige su área y su importancia y decide si va a Siguiente,
 * a Algún día o se descarta. El área y la importancia se guardan junto con la decisión.
 */
export const BandejaCard: React.FC<{ item: Item }> = ({ item }) => {
  const { data: areas = [] } = useAreas();
  const update = useUpdateItem();
  const [areaId, setAreaId] = useState<string | null>(item.area_id);
  const [importance, setImportance] = useState<Importance | null>(item.importance as Importance | null);
  const [needsArea, setNeedsArea] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mover = async (status: Extract<ItemStatus, 'siguiente' | 'algun_dia' | 'descartado'>) => {
    if (status === 'siguiente' && !areaId) { setNeedsArea(true); return; }
    setError(null);
    try {
      await update.mutateAsync({ id: item.id, patch: { version: item.version, status, areaId, importance } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar';
      setError(msg === 'version' ? 'Cambió en otro lado. Recarga la bandeja.' : msg);
    }
  };

  return (
    <Card as="article" aria-label={item.title} className="flex flex-col gap-3">
      <h3 className="m-0 text-[17px] font-extrabold leading-snug">{item.title}</h3>
      <AreaPicker areas={areas} value={areaId} onChange={(id) => { setAreaId(id); setNeedsArea(false); }} invalid={needsArea} />
      {needsArea && <p className="m-0 -mt-1 text-[13px] font-semibold text-pink-text">Elige un área</p>}
      <ImportanceDots value={importance} onChange={setImportance} />
      {error && <p role="alert" className="m-0 text-[13px] font-semibold text-pink-text">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => void mover('siguiente')} loading={update.isPending}>Siguiente</Button>
        <Button size="sm" variant="secondary" onClick={() => void mover('algun_dia')} disabled={update.isPending}>Algún día</Button>
        <Button size="sm" variant="ghost" onClick={() => void mover('descartado')} disabled={update.isPending}>Descartar</Button>
      </div>
    </Card>
  );
};
