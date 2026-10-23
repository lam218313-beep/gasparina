import React, { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { CloudUpload, WifiOff } from 'lucide-react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);

/** Arriba de todo: avisa cuando no hay señal (y cuántos cambios esperan) o mientras se envían. */
export const OfflineBar: React.FC = () => {
  const online = useSyncExternalStore(subscribe, () => onlineManager.isOnline());
  const pendientes = useMutationState({ filters: { status: 'pending' }, select: (m) => m.state.isPaused });
  const enCola = pendientes.filter(Boolean).length;
  if (online && pendientes.length === 0) return null;

  const plural = (n: number) => `${n} ${n === 1 ? 'cambio' : 'cambios'}`;
  const texto = online
    ? `Enviando ${plural(pendientes.length)}…`
    : `Sin conexión: tus cambios se enviarán al volver${enCola > 0 ? ` · ${plural(enCola)}` : ''}`;

  return (
    <div aria-live="polite" className="fixed inset-x-0 top-0 z-[45] pt-safe px-4 pointer-events-none">
      <div className="mx-auto max-w-[480px] flex items-center gap-2 bg-raised border border-edge rounded-full px-4 py-2 text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
        {online ? <CloudUpload size={16} className="shrink-0" /> : <WifiOff size={16} className="shrink-0 text-pink-text" />}
        <span>{texto}</span>
      </div>
    </div>
  );
};
