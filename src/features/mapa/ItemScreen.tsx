import React, { useState } from 'react';
import { Link, useParams } from 'react-router';
import { fmtDay, fmtHour } from '@/lib/dates';
import { useCreateItem, useEvents, useItem, useItems, useUpdateItem } from '@/lib/queries';
import { STATUSES, STATUS_LABEL, type Importance, type Item, type ItemStatus } from '@/lib/types';
import { Button, DetailScreen, ErrorState, ImportanceDots, Loading, Section } from '@/ui';
import { EditarSheet } from './EditarSheet';
import { Historial } from './Historial';
import { ItemRow } from './ItemRow';
import { NombreSheet } from './NombreSheet';

const VISIBLES: ItemStatus[] = ['bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia', 'hecho'];

const Ficha: React.FC<{ item: Item }> = ({ item }) => {
  const { data: hijos = [] } = useItems({ parentId: item.id, status: VISIBLES });
  const { data: events = [] } = useEvents(item.id);
  const { data: origen } = useItem(item.origin_item_id ?? undefined);
  const update = useUpdateItem();
  const create = useCreateItem();
  const [editando, setEditando] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = async (patch: { status: ItemStatus } | { importance: Importance }) => {
    setError(null);
    try {
      await update.mutateAsync({ id: item.id, patch: { version: item.version, ...patch } });
    } catch (e) {
      setError(e instanceof Error && e.message === 'version' ? 'Cambió en otro lado. Recarga.' : (e as Error).message);
    }
  };

  return (
    <DetailScreen
      back={item.area_slug ? `/mapa/area/${item.area_slug}` : '/mapa'}
      center={<span className="font-display font-extrabold text-[15px] text-text-2">{item.short_id ?? ''}</span>}
      right={<Button size="sm" variant="secondary" onClick={() => setEditando(true)}>Editar</Button>}
    >
      <header className="flex flex-col gap-1.5">
        {item.path && <p className="m-0 text-[13px] font-bold text-text-3">{item.path}</p>}
        <h1 className="font-display font-bold text-[26px] leading-[1.1] m-0">{item.title}</h1>
        {item.body && <p className="m-0 text-[15px] leading-relaxed text-text-2 whitespace-pre-wrap">{item.body}</p>}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Estado"
          value={item.status}
          onChange={(e) => void cambiar({ status: e.target.value as ItemStatus })}
          disabled={update.isPending}
          className="h-[34px] rounded-full bg-raised border border-edge px-3 text-xs font-extrabold text-white"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <ImportanceDots value={item.importance} onChange={(v) => void cambiar({ importance: v })} />
        {item.due_at && <span className="text-[13px] font-bold text-text-2">Vence {fmtDay(item.due_at)}</span>}
        {item.kind === 'evento' && item.start_at && (
          <span className="text-[13px] font-bold text-text-2">
            {fmtDay(item.start_at)} {fmtHour(item.start_at)}{item.duration_min ? ` · ${item.duration_min} min` : ''}{item.repeat_rule === 'semanal' ? ' · cada semana' : ''}
          </span>
        )}
      </div>
      {error && <p role="alert" className="m-0 text-[13px] font-semibold text-pink-text">{error}</p>}

      <Section title="Nació de">
        {origen ? (
          <Link to={`/mapa/item/${origen.id}`} className="text-[14px] font-bold text-white no-underline">{origen.title}</Link>
        ) : (
          <p className="m-0 text-[14px] text-text-3">Captura manual</p>
        )}
      </Section>

      <Section title="Dentro" action={<Button size="sm" variant="secondary" onClick={() => setNuevaTarea(true)}>Añadir tarea</Button>}>
        {hijos.length === 0 ? (
          <p className="m-0 text-[14px] text-text-3">Nada dentro todavía.</p>
        ) : (
          <ul role="list" aria-label="Dentro" className="list-none m-0 p-0 flex flex-col gap-2.5">
            {hijos.map((h) => <li key={h.id}><ItemRow item={h} /></li>)}
          </ul>
        )}
      </Section>

      <Section title="Historial"><Historial events={events} /></Section>

      {editando && <EditarSheet item={item} open onClose={() => setEditando(false)} />}
      <NombreSheet open={nuevaTarea} title="Nueva tarea" onClose={() => setNuevaTarea(false)}
        onCreate={async (titulo) => { await create.mutateAsync({ title: titulo, parentId: item.id, areaId: null, status: 'siguiente' }); }} />
    </DetailScreen>
  );
};

/** La ficha de un ítem: qué es, de quién cuelga, qué tiene dentro y cómo fue cambiando. */
export const ItemScreen: React.FC = () => {
  const { id } = useParams();
  const { data: item, isPending, error, refetch } = useItem(id);
  if (item) return <Ficha item={item} />;
  if (isPending) return <DetailScreen back="/mapa"><Loading /></DetailScreen>;
  return <DetailScreen back="/mapa"><ErrorState message={error?.message ?? 'No se encontró'} onRetry={() => void refetch()} /></DetailScreen>;
};
