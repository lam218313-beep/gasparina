import React from 'react';
import { Inbox, ArrowRight, Play, Hourglass, Moon, Check, X } from 'lucide-react';

/** Los siete estados de un ítem, tal como los guarda la base (`items.status`). */
export type Status = 'bandeja' | 'siguiente' | 'en_curso' | 'esperando' | 'algun_dia' | 'hecho' | 'descartado';

/** El estado siempre lleva icono y palabra, nunca solo color. Solo negros, grises y rosa. */
const STYLES: Record<Status, { label: string; cls: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }> = {
  bandeja: { label: 'Bandeja', cls: 'bg-raised text-text-2', Icon: Inbox },
  siguiente: { label: 'Siguiente', cls: 'bg-pink-fill text-white', Icon: ArrowRight },
  en_curso: { label: 'En curso', cls: 'border border-pink-text text-pink-text', Icon: Play },
  esperando: { label: 'Esperando', cls: 'bg-edge text-white', Icon: Hourglass },
  algun_dia: { label: 'Algún día', cls: 'bg-raised text-text-3', Icon: Moon },
  hecho: { label: 'Hecho', cls: 'bg-edge text-white', Icon: Check },
  descartado: { label: 'Descartado', cls: 'bg-raised text-text-3', Icon: X },
};

export const StatusChip: React.FC<{ status: Status; label?: string; size?: 'sm' | 'md' }> = ({ status, label, size = 'sm' }) => {
  const { label: text, cls, Icon } = STYLES[status];
  const dims = size === 'sm' ? 'h-6 px-2 text-[11px] gap-1' : 'h-[30px] px-3 text-xs gap-1.5';
  return (
    <span className={`inline-flex items-center shrink-0 rounded-full font-extrabold box-border ${dims} ${cls}`}>
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={3} />
      {label ?? text}
    </span>
  );
};

/** Etiqueta neutra (fecha, tipo, fuente). */
export const Tag: React.FC<{ children: React.ReactNode; tone?: 'raised' | 'edge' | 'pink' }> = ({ children, tone = 'raised' }) => {
  const cls = tone === 'pink' ? 'bg-pink/15 text-pink-text' : tone === 'edge' ? 'bg-edge text-white' : 'bg-raised text-white';
  return <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-extrabold ${cls}`}>{children}</span>;
};
