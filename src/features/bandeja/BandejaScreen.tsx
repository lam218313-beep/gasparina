import React from 'react';
import { Inbox } from 'lucide-react';
import { useItems } from '@/lib/queries';
import { EmptyState, ErrorState, Loading, Screen } from '@/ui';
import { BandejaCard } from './BandejaCard';

/** Lo capturado sin área: aquí se ordena a mano. */
export const BandejaScreen: React.FC = () => {
  const { data, isPending, error, refetch } = useItems({ status: ['bandeja'] });
  return (
    <Screen title="Bandeja">
      {isPending ? (
        <Loading />
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={<Inbox size={28} />} title="Nada por ordenar." text="Lo que captures sin área aparece aquí." />
      ) : (
        <ul role="list" className="list-none m-0 p-0 flex flex-col gap-3">
          {data.map((item) => <li key={item.id}><BandejaCard item={item} /></li>)}
        </ul>
      )}
    </Screen>
  );
};
