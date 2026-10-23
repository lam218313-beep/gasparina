import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Un aviso corto que aparece abajo y se va solo ("Guardado"). */
export const Toast: React.FC<{ text: string | null }> = ({ text }) =>
  text
    ? createPortal(
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[60] bg-raised border border-edge text-white text-[14px] font-bold px-4 py-2.5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          {text}
        </div>,
        document.body,
      )
    : null;

/** El texto del aviso y la función para mostrarlo durante `ms` milisegundos. */
export function useToast(ms = 1500): [string | null, (text: string) => void] {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((t: string) => {
    setText(t);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setText(null), ms);
  }, [ms]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [text, show];
}
