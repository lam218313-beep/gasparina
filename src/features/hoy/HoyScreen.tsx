import React, { useState } from 'react';
import { Sun } from 'lucide-react';
import { fmtDay, todayLima } from '@/lib/dates';
import { useToday } from '@/lib/queries';
import { Button, EmptyState, ErrorState, Loading, Screen, Section } from '@/ui';
import { Agenda } from './Agenda';
import { ElegirFocoSheet } from './ElegirFocoSheet';
import { FocoCard } from './FocoCard';

/** Hoy: hasta tres cosas para ahora, la agenda del día y lo de esta noche. */
export const HoyScreen: React.FC = () => {
  const day = todayLima();
  const { data, isPending, error, refetch } = useToday(day);
  const [eligiendo, setEligiendo] = useState(false);

  const foco = data?.filter((e) => e.bucket === 'foco') ?? [];
  const noche = data?.filter((e) => e.bucket === 'noche') ?? [];
  const agenda = data?.filter((e) => e.bucket === 'agenda' || e.bucket === 'vence') ?? [];
  const libre = !!data && data.length === 0;

  return (
    <Screen title="Hoy" action={<span className="text-[13px] font-bold text-text-3">{fmtDay(new Date().toISOString())}</span>}>
      {isPending ? (
        <Loading />
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <>
          <Section title="Para ahora" action={foco.length < 3 ? <Button size="sm" variant="secondary" onClick={() => setEligiendo(true)}>Elegir</Button> : undefined}>
            {foco.length === 0 ? (
              <p className="m-0 text-[14px] text-text-3">Nada elegido todavía.</p>
            ) : (
              <ul role="list" aria-label="Para ahora" className="list-none m-0 p-0 flex flex-col gap-3">
                {foco.map(({ item }) => <li key={item.id}><FocoCard item={item} /></li>)}
              </ul>
            )}
          </Section>
          {libre ? (
            <EmptyState icon={<Sun size={28} />} title="Día libre." text="Captura algo con +" />
          ) : (
            <>
              <Section title="Agenda"><Agenda entries={agenda} /></Section>
              {noche.length > 0 && (
                <Section title="Esta noche">
                  <ul role="list" aria-label="Esta noche" className="list-none m-0 p-0 flex flex-col gap-2">
                    {noche.map(({ item }) => (
                      <li key={item.id} className="flex items-center gap-3 py-1.5">
                        <span className="w-1 h-6 rounded-full shrink-0" style={{ background: item.area_color ?? '#4A4A55' }} aria-hidden />
                        <span className="text-[15px] font-bold">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </>
      )}
      <ElegirFocoSheet open={eligiendo} onClose={() => setEligiendo(false)} focoCount={foco.length} day={day} />
    </Screen>
  );
};
