import React, { useEffect, useState } from 'react';
import { useAreas, useUpdateItem } from '@/lib/queries';
import type { Importance, Item, ItemStatus } from '@/lib/types';
import { AreaPicker, Button, Card, ImportanceDots, avisar } from '@/ui';

type Destino = Extract<ItemStatus, 'siguiente' | 'algun_dia' | 'descartado'>;

/**
 * Una cosa capturada, por ordenar: elige su área y su importancia y decide si va a Siguiente,
 * a Algún día o se descarta. El área y la importancia se guardan junto con la decisión; la tarjeta
 * se va al instante (el cambio viaja solo, o espera en cola sin señal). Descartar pide confirmar.
 */
export const BandejaCard: React.FC<{ item: Item }> = ({ item }) => {
  const { data: areas = [] } = useAreas();
  const update = useUpdateItem();
  const [areaId, setAreaId] = useState<string | null>(item.area_id);
  const [importance, setImportance] = useState<Importance | null>(item.importance as Importance | null);
  const [needsArea, setNeedsArea] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // La confirmación de Descartar caduca sola.
  useEffect(() => {
    if (!confirmando) return;
    const t = window.setTimeout(() => setConfirmando(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmando]);

  const mover = (status: Destino) => {
    // Sin área, Siguiente y Algún día dejarían el ítem fuera de toda pantalla.
    if (status !== 'descartado' && !areaId) { setNeedsArea(true); return; }
    if (status === 'descartado' && !confirmando) { setConfirmando(true); return; }
    update.mutate(
      { id: item.id, patch: { version: item.version, status, areaId, importance } },
      { onError: (e) => avisar(e instanceof Error && e.message === 'version' ? 'Cambió en otro lado. Recarga la bandeja.' : `No se pudo guardar: ${(e as Error).message}`, 3000) },
    );
  };

  return (
    <Card as="article" aria-label={item.title} className="flex flex-col gap-3">
      <h3 className="m-0 text-[17px] font-extrabold leading-snug">{item.title}</h3>
      <AreaPicker areas={areas} value={areaId} onChange={(id) => { setAreaId(id); setNeedsArea(false); }} invalid={needsArea} />
      {needsArea && <p className="m-0 -mt-1 text-[13px] font-semibold text-pink-text">Elige un área</p>}
      <ImportanceDots value={importance} onChange={setImportance} />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => mover('siguiente')}>Siguiente</Button>
        <Button size="sm" variant="secondary" onClick={() => mover('algun_dia')}>Algún día</Button>
        <Button size="sm" variant={confirmando ? 'primary' : 'ghost'} onClick={() => mover('descartado')}>
          {confirmando ? '¿Seguro? Descartar' : 'Descartar'}
        </Button>
      </div>
    </Card>
  );
};
