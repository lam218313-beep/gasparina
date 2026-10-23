import React from 'react';
import type { Importance } from '@/lib/types';

const NIVELES: Importance[] = [1, 2, 3, 4, 5];

/** La importancia de 1 a 5 como puntos. Con `onChange`, tocar un punto la fija; sin él, solo se muestra. */
export const ImportanceDots: React.FC<{ value: number | null; onChange?: (value: Importance) => void }> = ({ value, onChange }) => (
  <div role="group" aria-label="Importancia" className="flex items-center gap-1">
    {NIVELES.map((n) => {
      const dot = <span className={`block w-3 h-3 rounded-full ${value != null && n <= value ? 'bg-pink' : 'bg-mute'}`} aria-hidden />;
      return onChange ? (
        <button key={n} type="button" aria-label={`Importancia ${n}`} aria-pressed={value === n} onClick={() => onChange(n)}
          className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition">
          {dot}
        </button>
      ) : (
        <span key={n} className="w-3.5 h-3.5 flex items-center justify-center scale-75">{dot}</span>
      );
    })}
  </div>
);
