import React from 'react';
import type { Area } from '@/lib/types';

/** Un área como chip: su color como punto y, al elegirla, como tinte. */
export const AreaChip: React.FC<{ area: Area; selected: boolean; onSelect: (area: Area) => void }> = ({ area, selected, onSelect }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={() => onSelect(area)}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-extrabold border shrink-0 transition active:scale-95 ${selected ? 'text-white' : 'border-line text-text-2'}`}
    style={selected ? { borderColor: area.color, background: `${area.color}26` } : undefined}
  >
    <span className="w-2 h-2 rounded-full" style={{ background: area.color }} aria-hidden />
    {area.name}
  </button>
);

/** La fila de chips, desplazable de lado. Tocar el área elegida la quita. */
export const AreaPicker: React.FC<{ areas: Area[]; value: string | null; onChange: (id: string | null) => void; invalid?: boolean }> = ({ areas, value, onChange, invalid }) => (
  <div role="group" aria-label="Área" className={`flex gap-2 overflow-x-auto -mx-5 px-5 py-1 ${invalid ? 'rounded-xl outline outline-2 outline-pink-text' : ''}`}>
    {areas.map((area) => (
      <AreaChip key={area.id} area={area} selected={value === area.id} onSelect={(a) => onChange(value === a.id ? null : a.id)} />
    ))}
  </div>
);
