import React from 'react';
import { useParams } from 'react-router';
import { fmtHour } from '@/lib/dates';
import { useAreas, useItems } from '@/lib/queries';
import type { Area, ItemStatus } from '@/lib/types';
import { DetailScreen, EmptyState, ListRow, Loading, StatusChip } from '@/ui';
import { MapPin } from 'lucide-react';

const ABIERTOS: ItemStatus[] = ['bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia'];

const AreaItems: React.FC<{ area: Area }> = ({ area }) => {
  const { data, isPending } = useItems({ areaId: area.id, status: ABIERTOS });
  if (isPending || !data) return <Loading />;
  if (data.length === 0) return <EmptyState icon={<MapPin size={28} />} title="Nada aquí todavía." text="Captura algo con + y elige esta área." />;
  return (
    <ul role="list" className="list-none m-0 p-0 flex flex-col gap-3">
      {data.map((item) => (
        <li key={item.id}>
          <ListRow
            title={item.title}
            detail={[item.short_id, item.start_at ? fmtHour(item.start_at) : null].filter(Boolean).join(' · ')}
            trailing={<StatusChip status={item.status} />}
          />
        </li>
      ))}
    </ul>
  );
};

/** Provisional: los ítems abiertos de un área. La tarea 9 la convierte en Proyectos y Sueltas. */
export const AreaScreen: React.FC = () => {
  const { slug } = useParams();
  const { data: areas } = useAreas();
  const area = areas?.find((a) => a.slug === slug);
  return (
    <DetailScreen back="/mapa" center={<span className="font-display font-extrabold text-[17px]">{area?.name ?? ''}</span>}>
      {area ? <AreaItems area={area} /> : <Loading />}
    </DetailScreen>
  );
};
