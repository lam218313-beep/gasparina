import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useAreas, useCreateItem, useItems, useProjectProgress } from '@/lib/queries';
import type { Area, Item, ItemStatus } from '@/lib/types';
import { Button, DetailScreen, ListRow, Loading, Section, StatusChip } from '@/ui';
import { ItemRow } from './ItemRow';
import { NombreSheet } from './NombreSheet';

// Todo menos lo descartado: lo hecho también se ve, con su estado.
const VISIBLES: ItemStatus[] = ['bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia', 'hecho'];

/** Un proyecto con su barra de avance: tareas hechas / tareas en total. */
const ProyectoRow: React.FC<{ item: Item }> = ({ item }) => {
  const { data } = useProjectProgress(item.id);
  const done = data?.done ?? 0;
  const total = data?.total ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <ListRow
      to={`/mapa/item/${item.id}`}
      title={item.title}
      detail={
        <span className="flex items-center gap-2">
          <span className="w-20 h-1.5 rounded-full bg-mute overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${pct}%`, background: item.area_color ?? '#EB0C6E' }} /></span>
          <span>{done}/{total}</span>
          {item.short_id && <span>· {item.short_id}</span>}
        </span>
      }
      trailing={<StatusChip status={item.status} />}
    />
  );
};

const AreaBody: React.FC<{ area: Area }> = ({ area }) => {
  const { data: items, isPending } = useItems({ areaId: area.id, status: VISIBLES });
  const create = useCreateItem();
  const [nuevo, setNuevo] = useState(false);
  if (isPending || !items) return <Loading />;
  const proyectos = items.filter((i) => i.kind === 'proyecto');
  const sueltas = items.filter((i) => i.kind !== 'proyecto' && i.parent_id === null);
  return (
    <>
      <Section title="Proyectos" action={<Button size="sm" variant="secondary" onClick={() => setNuevo(true)}>Nuevo proyecto</Button>}>
        {proyectos.length === 0 ? (
          <p className="m-0 text-[14px] text-text-3">Sin proyectos.</p>
        ) : (
          <ul role="list" aria-label="Proyectos" className="list-none m-0 p-0 flex flex-col gap-2.5">
            {proyectos.map((p) => <li key={p.id}><ProyectoRow item={p} /></li>)}
          </ul>
        )}
      </Section>
      <Section title="Sueltas">
        {sueltas.length === 0 ? (
          <p className="m-0 text-[14px] text-text-3">Nada suelto. Captura algo con + y elige esta área.</p>
        ) : (
          <ul role="list" aria-label="Sueltas" className="list-none m-0 p-0 flex flex-col gap-2.5">
            {sueltas.map((i) => <li key={i.id}><ItemRow item={i} /></li>)}
          </ul>
        )}
      </Section>
      <NombreSheet open={nuevo} title="Nuevo proyecto" onClose={() => setNuevo(false)}
        onCreate={async (titulo) => { await create.mutateAsync({ title: titulo, kind: 'proyecto', status: 'en_curso', areaId: area.id }); }} />
    </>
  );
};

/** Un área: sus proyectos (con avance) y sus tareas sueltas. */
export const AreaScreen: React.FC = () => {
  const { slug } = useParams();
  const { data: areas } = useAreas();
  const area = areas?.find((a) => a.slug === slug);
  return (
    <DetailScreen back="/mapa" center={
      <span className="flex items-center gap-2 font-display font-extrabold text-[17px]">
        {area && <span className="w-2.5 h-2.5 rounded-full" style={{ background: area.color }} aria-hidden />}
        {area?.name ?? ''}
      </span>
    }>
      {area ? <AreaBody area={area} /> : <Loading />}
    </DetailScreen>
  );
};
