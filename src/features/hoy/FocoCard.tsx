import React from 'react';
import { Check } from 'lucide-react';
import { useUpdateItem } from '@/lib/queries';
import type { Item } from '@/lib/types';
import { Button, Card, avisar } from '@/ui';

/** Una de las (hasta tres) cosas para ahora: su área por color, su código y dos salidas: Hecho o Quitar. */
export const FocoCard: React.FC<{ item: Item }> = ({ item }) => {
  const update = useUpdateItem();

  // La tarjeta se va al instante; el cambio viaja solo (o espera en cola sin señal).
  const guardar = (patch: { status: 'hecho' } | { focusOn: null }) =>
    update.mutate(
      { id: item.id, patch: { version: item.version, ...patch } },
      { onError: (e) => avisar(e instanceof Error && e.message === 'version' ? 'Cambió en otro lado. Recarga.' : `No se pudo guardar: ${(e as Error).message}`, 3000) },
    );

  return (
    <Card as="article" aria-label={item.title} className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Hecho"
        onClick={() => guardar({ status: 'hecho' })}
        className="w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center text-white active:scale-95 transition"
        style={{ borderColor: item.area_color ?? '#4A4A55' }}
      >
        <Check size={20} strokeWidth={3} />
      </button>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-extrabold leading-snug">{item.title}</span>
        <span className="block text-[12px] font-bold text-text-3 mt-0.5">{item.short_id ?? ''}</span>
      </span>
      <Button variant="ghost" size="sm" onClick={() => guardar({ focusOn: null })}>Quitar</Button>
    </Card>
  );
};
