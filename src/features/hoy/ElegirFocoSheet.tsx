import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useAreas, useItems, useUpdateItem } from '@/lib/queries';
import type { Item } from '@/lib/types';
import { Button, Sheet } from '@/ui';

const MAXIMO = 3;

/**
 * Elegir qué va en "Para ahora": los ítems abiertos, por área, los más importantes primero.
 * Se pueden tocar varios seguidos; al llegar a tres, la hoja avisa y ya no deja más.
 */
export const ElegirFocoSheet: React.FC<{ open: boolean; onClose: () => void; focoCount: number; day: string }> = ({ open, onClose, focoCount, day }) => {
  const { data: items = [] } = useItems({ status: ['siguiente', 'en_curso', 'esperando'] });
  const { data: areas = [] } = useAreas();
  const update = useUpdateItem();
  const refrescando = useIsFetching({ queryKey: ['today'] }) > 0;
  const [mensaje, setMensaje] = useState<string | null>(null);
  // Cuenta local por si la base aún no devolvió el nuevo total: así nunca se cuela un cuarto.
  const base = useRef(0);
  const [elegidos, setElegidos] = useState(0);
  useEffect(() => { if (open) { base.current = focoCount; setElegidos(0); setMensaje(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = Math.max(focoCount, base.current + elegidos);

  const grupos = useMemo(() => {
    const pendientes = items.filter((i) => i.focus_on !== day);
    const peso = (i: Item) => [-(i.effective_importance ?? 0), i.due_at ?? '9999'] as const;
    pendientes.sort((a, b) => peso(a)[0] - peso(b)[0] || (peso(a)[1] < peso(b)[1] ? -1 : peso(a)[1] > peso(b)[1] ? 1 : 0));
    return areas
      .map((area) => ({ area, items: pendientes.filter((i) => i.effective_area_id === area.id) }))
      .filter((g) => g.items.length > 0);
  }, [items, areas, day]);

  const elegir = async (item: Item) => {
    if (total >= MAXIMO) { setMensaje(`Ya tienes ${MAXIMO} para ahora`); return; }
    setMensaje(null);
    try {
      await update.mutateAsync({ id: item.id, patch: { version: item.version, focusOn: day } });
      setElegidos((n) => n + 1);
    } catch (e) {
      setMensaje(e instanceof Error && e.message === 'version' ? 'Cambió en otro lado. Cierra y vuelve a abrir.' : (e as Error).message);
    }
  };

  return (
    <Sheet open={open} title="Para ahora" onClose={onClose}>
      <p className="m-0 text-[13px] font-bold text-text-3">{total} de {MAXIMO} elegidos</p>
      {mensaje && <p role="alert" className="m-0 text-[13px] font-semibold text-pink-text">{mensaje}</p>}
      {grupos.length === 0 && <p className="m-0 text-[14px] text-text-3">No hay nada abierto por elegir.</p>}
      {grupos.map(({ area, items: lista }) => (
        <section key={area.id} className="flex flex-col gap-2">
          <h3 className="eyebrow m-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: area.color }} aria-hidden />
            {area.name}
          </h3>
          {lista.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void elegir(item)}
              disabled={update.isPending || refrescando}
              className="flex items-center gap-3 w-full text-left bg-raised rounded-[16px] px-4 py-3 active:scale-[0.99] transition disabled:opacity-60"
            >
              <span className="flex-1 min-w-0 text-[15px] font-bold leading-snug">{item.title}</span>
              <span className="text-[12px] font-bold text-text-3">{item.short_id ?? ''}</span>
            </button>
          ))}
        </section>
      ))}
      <Button variant="secondary" block onClick={onClose}>Listo</Button>
    </Sheet>
  );
};
