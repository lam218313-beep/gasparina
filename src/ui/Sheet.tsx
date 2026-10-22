import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Panel que sube desde abajo (capturar, editar, confirmar). Escape o tocar el fondo lo cierra. */
export const Sheet: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  const panel = useRef<HTMLDivElement>(null);
  // onClose casi siempre llega en línea (cambia en cada pintada del padre). Se guarda en un ref para que
  // el efecto dependa solo de `open`: si no, cada tecla volvería a ejecutarlo y el foco saltaría al panel.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/70 lg:p-6" onClick={onClose}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] lg:max-w-[520px] bg-card border-t lg:border border-edge rounded-t-[32px] lg:rounded-[28px] px-5 lg:px-7 pt-3.5 lg:pt-6 pb-safe lg:pb-7 flex flex-col gap-4 outline-none max-h-[92vh] overflow-y-auto">
        <span className="w-10 h-1 rounded-full bg-line self-center lg:hidden" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-bold text-2xl m-0">{title}</h2>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="w-11 h-11 rounded-[14px] border border-line flex items-center justify-center"><X size={18} strokeWidth={2.5} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
};
