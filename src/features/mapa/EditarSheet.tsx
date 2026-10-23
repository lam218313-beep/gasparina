import React, { useState } from 'react';
import { dayOf, fmtHour, limaToIso, todayLima } from '@/lib/dates';
import { useItems, useUpdateItem } from '@/lib/queries';
import type { Item, ItemStatus } from '@/lib/types';
import { Button, Field, Sheet, TextArea } from '@/ui';

const CANDIDATOS: ItemStatus[] = ['bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia', 'hecho'];

/**
 * Editar un ítem: título, notas, de quién cuelga (buscando por título) y sus fechas.
 * Se monta al abrir y se desmonta al cerrar: toma los datos del ítem una sola vez, así los refrescos
 * de la ficha mientras se edita no pisan lo escrito ni borran el mensaje de error.
 */
export const EditarSheet: React.FC<{ item: Item; open: boolean; onClose: () => void }> = ({ item, open, onClose }) => {
  const update = useUpdateItem();
  const { data: candidatos = [] } = useItems({ status: CANDIDATOS });
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body ?? '');
  const [parentId, setParentId] = useState<string | null>(item.parent_id);
  const [busca, setBusca] = useState('');
  const [vence, setVence] = useState(item.due_at ? dayOf(item.due_at) : '');
  const [dia, setDia] = useState(item.start_at ? dayOf(item.start_at) : todayLima());
  const [hora, setHora] = useState(item.start_at ? fmtHour(item.start_at) : '09:00');
  const [error, setError] = useState<string | null>(null);

  const padre = candidatos.find((c) => c.id === parentId);
  const q = busca.trim().toLowerCase();
  // Uno mismo nunca sale como padre; lo demás lo decide la base (un descendiente da "ciclo").
  const resultados = q ? candidatos.filter((c) => c.id !== item.id && c.id !== parentId && c.title.toLowerCase().includes(q)).slice(0, 8) : [];

  const guardar = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        id: item.id,
        patch: {
          version: item.version,
          title: title.trim(),
          body: body.trim() || null,
          parentId,
          ...(item.kind === 'evento'
            ? { startAt: limaToIso(dia, hora) }
            : { dueAt: vence ? limaToIso(vence, '23:59') : null }),
        },
      });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar';
      setError(msg === 'version' ? 'Cambió en otro lado. Cierra y vuelve a abrir.' : msg);
    }
  };

  return (
    <Sheet open={open} title="Editar" onClose={onClose}>
      <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Notas" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-col gap-2">
        <Field label="Padre" placeholder="Busca por título" value={busca} onChange={(e) => setBusca(e.target.value)}
          hint={padre ? `Dentro de: ${padre.title}` : 'Suelta (sin padre)'} />
        {padre && <Button size="sm" variant="ghost" className="self-start" onClick={() => setParentId(null)}>Quitar padre</Button>}
        {resultados.length > 0 && (
          <ul role="list" className="list-none m-0 p-0 flex flex-col gap-1.5">
            {resultados.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => { setParentId(c.id); setBusca(''); }}
                  className="flex items-center gap-3 w-full text-left bg-raised rounded-[14px] px-4 py-2.5 active:scale-[0.99] transition">
                  <span className="flex-1 min-w-0 text-[14px] font-bold">{c.title}</span>
                  <span className="text-[12px] font-bold text-text-3">{c.short_id ?? ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {item.kind === 'evento' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
          <Field label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      ) : (
        <Field label="Fecha límite" type="date" value={vence} onChange={(e) => setVence(e.target.value)} hint="Opcional" />
      )}
      {error && <p role="alert" className="m-0 text-[13px] font-semibold text-pink-text">{error}</p>}
      <Button type="button" block onClick={() => void guardar()} disabled={title.trim() === ''} loading={update.isPending}>Guardar</Button>
    </Sheet>
  );
};
