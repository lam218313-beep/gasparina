import React from 'react';
import { useItems } from '@/lib/queries';
import { DetailScreen, EmptyState, Loading } from '@/ui';
import { Trash2 } from 'lucide-react';
import { ItemRow } from './ItemRow';

/** Lo descartado no se borra: aquí se ve y, desde su ficha, se puede recuperar cambiándole el estado. */
export const DescartadasScreen: React.FC = () => {
  const { data, isPending } = useItems({ status: ['descartado'] });
  return (
    <DetailScreen back="/mapa" center={<span className="font-display font-extrabold text-[17px]">Descartadas</span>}>
      {isPending || !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState icon={<Trash2 size={28} />} title="Nada descartado." text="Lo que descartes aparece aquí por si lo quieres de vuelta." />
      ) : (
        <ul role="list" aria-label="Descartadas" className="list-none m-0 p-0 flex flex-col gap-2.5">
          {data.map((i) => <li key={i.id}><ItemRow item={i} /></li>)}
        </ul>
      )}
    </DetailScreen>
  );
};
