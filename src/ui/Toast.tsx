import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/** Un aviso corto que aparece abajo y se va solo ("Guardado"). */
export const Toast: React.FC<{ text: string | null }> = ({ text }) =>
  text
    ? createPortal(
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[60] max-w-[90vw] text-center bg-raised border border-edge text-white text-[14px] font-bold px-4 py-2.5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          {text}
        </div>,
        document.body,
      )
    : null;

// Un solo aviso para toda la app: cualquier pantalla (o un cambio que termina cuando la hoja que lo
// pidió ya se cerró) puede llamar a avisar(); Avisos lo pinta desde el marco de la app.
let actual: string | null = null;
let timer: number | undefined;
const listeners = new Set<() => void>();
const emitir = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function avisar(texto: string, ms = 1500): void {
  actual = texto;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { actual = null; emitir(); }, ms);
  emitir();
}

export const Avisos: React.FC = () => {
  const texto = useSyncExternalStore(subscribe, () => actual);
  return <Toast text={texto} />;
};
