import React from 'react';
import { useAreas } from '@/lib/queries';
import { Card, ErrorState, Loading, Screen } from '@/ui';

/** Provisional: la lista de áreas. La tarea 9 la convierte en Área › Proyecto › Tarea. */
export const MapaScreen: React.FC = () => {
  const { data: areas, isPending, error, refetch } = useAreas();
  return (
    <Screen title="Mapa">
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <ul role="list" aria-label="Áreas" className="list-none m-0 p-0 flex flex-col gap-3">
          {areas.map((area) => (
            <li key={area.id}>
              <Card className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: area.color }} aria-hidden />
                <h3 className="m-0 text-[17px] font-extrabold">{area.name}</h3>
                <span className="ml-auto text-xs font-bold text-text-3">{area.prefix}</span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
};
