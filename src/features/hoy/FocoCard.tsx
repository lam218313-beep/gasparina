import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useUpdateItem } from '@/lib/queries';
import type { Item } from '@/lib/types';
import { Button, Card } from '@/ui';

/** Una de las (hasta tres) cosas para ahora: su área por color, su código y dos salidas: Hecho o Quitar. */
export const FocoCard: React.FC<{ item: Item }> = ({ item }) => {
  const update = useUpdateItem();
  const [error, setError] = useState<string | null>(null);

  const guardar = async (patch: { status: 'hecho' } | { focusOn: null }) => {
    setError(null);
    try {
      await update.mutateAsync({ id: item.id, patch: { version: item.version, ...patch } });
    } catch (e) {
      setError(e instanceof Error && e.message === 'version' ? 'Cambió en otro lado. Recarga.' : (e as Error).message);
    }
  };

  return (
    <Card as="article" aria-label={item.title} className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Hecho"
        onClick={() => void guardar({ status: 'hecho' })}
        disabled={update.isPending}
        className="w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center text-white active:scale-95 transition disabled:opacity-50"
        style={{ borderColor: item.area_color ?? '#4A4A55' }}
      >
        <Check size={20} strokeWidth={3} />
      </button>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-extrabold leading-snug">{item.title}</span>
        <span className="block text-[12px] font-bold text-text-3 mt-0.5">
          {item.short_id ?? ''}
          {error && <span className="text-pink-text"> · {error}</span>}
        </span>
      </span>
      <Button variant="ghost" size="sm" onClick={() => void guardar({ focusOn: null })} disabled={update.isPending}>Quitar</Button>
    </Card>
  );
};
