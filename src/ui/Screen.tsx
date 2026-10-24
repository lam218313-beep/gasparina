import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from './Button';

/** El punto rosa que cierra cada título. */
export const Dot: React.FC = () => <span className="text-pink">.</span>;

export const Wordmark: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <span className="font-display font-extrabold" style={{ fontSize: size }}>gasparina<Dot /></span>
);

/**
 * Pantalla principal de una pestaña: título grande con el punto rosa y una acción opcional a la derecha.
 * Deja espacio abajo para la barra de pestañas flotante.
 */
export const Screen: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <div className="min-h-full px-5 pt-safe pb-36">
    <header className="flex items-center justify-between gap-3 pt-4 mb-5">
      <h1 className="font-display font-bold text-[28px] m-0">{title}<Dot /></h1>
      {action}
    </header>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

/** Pantalla de detalle: flecha de volver, elementos opcionales al centro y a la derecha, sin barra de pestañas. */
export const DetailScreen: React.FC<{ center?: React.ReactNode; right?: React.ReactNode; back?: string; footer?: React.ReactNode; children: React.ReactNode }> = ({ center, right, back, footer, children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-5 pt-safe flex items-center justify-between gap-3">
        <div className="pt-4 flex items-center justify-between gap-3 w-full">
          <IconButton label="Volver" onClick={() => (back ? navigate(back) : navigate(-1))}><ArrowLeft size={20} strokeWidth={2.5} /></IconButton>
          <div className="flex-1 min-w-0 flex justify-center">{center}</div>
          <div className="min-w-11 flex justify-end">{right}</div>
        </div>
      </header>
      <main className={`flex-1 px-5 pt-6 flex flex-col gap-5 ${footer ? 'pb-36' : 'pb-safe'}`}>{children}</main>
      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-ink border-t border-edge px-5 pt-3.5 pb-safe">
          <div className="mx-auto max-w-[480px]">{footer}</div>
        </div>
      )}
    </div>
  );
};
