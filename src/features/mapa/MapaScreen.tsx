import React from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useAreas, useItems } from '@/lib/queries';
import type { ItemStatus } from '@/lib/types';
import { ErrorState, Loading, Screen } from '@/ui';

const ABIERTOS: ItemStatus[] = ['bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia'];

/** El mapa: una tarjeta por área con cuánto hay abierto y cuántos proyectos. */
export const MapaScreen: React.FC = () => {
  const { data: areas, isPending, error, refetch } = useAreas();
  const { data: abiertos = [] } = useItems({ status: ABIERTOS });
  return (
    <Screen title="Mapa">
      {isPending ? (
        <Loading />
      ) : error && !areas ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <ul role="list" aria-label="Áreas" className="list-none m-0 p-0 flex flex-col gap-3">
          {areas.map((area) => {
            const propios = abiertos.filter((i) => i.effective_area_id === area.id);
            const proyectos = propios.filter((i) => i.kind === 'proyecto').length;
            const tareas = propios.length - proyectos;
            return (
              <li key={area.id}>
                <Link to={`/mapa/area/${area.slug}`} className="flex items-center gap-3.5 bg-card border border-edge rounded-[24px] p-[18px] text-white no-underline active:bg-raised transition">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: area.color }} aria-hidden />
                  <span className="flex-1 min-w-0">
                    <h3 className="m-0 text-[17px] font-extrabold">{area.name}</h3>
                    <span className="block text-[13px] text-text-3 mt-0.5">
                      {tareas} {tareas === 1 ? 'abierta' : 'abiertas'} · {proyectos} {proyectos === 1 ? 'proyecto' : 'proyectos'}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-text-3">{area.prefix}</span>
                  <ChevronRight size={20} className="text-text-3 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
};
