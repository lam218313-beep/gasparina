import React, { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { CloudUpload, TriangleAlert, WifiOff } from 'lucide-react';
import { limpiarFallos, useFallos } from '@/lib/fallos';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const plural = (n: number) => `${n} ${n === 1 ? 'cambio' : 'cambios'}`;

/**
 * Arriba de todo: avisa cuando no hay señal (y cuántos cambios esperan), mientras se envían, y si
 * algún cambio enviado después (cola restaurada) fue rechazado por la base.
 */
export const OfflineBar: React.FC = () => {
  const online = useSyncExternalStore(subscribe, () => onlineManager.isOnline());
  const pendientes = useMutationState({ filters: { status: 'pending' }, select: (m) => m.state.isPaused });
  const fallos = useFallos();
  const enCola = pendientes.filter(Boolean).length;

  if (fallos.length > 0) {
    return (
      <div className="fixed inset-x-0 top-0 z-[45] pt-safe px-4">
        <div role="alert" className="mx-auto max-w-[480px] flex items-center gap-2 bg-raised border border-pink-text rounded-[18px] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          <TriangleAlert size={16} className="shrink-0 text-pink-text" />
          <span className="flex-1 min-w-0">
            {plural(fallos.length)} no se {fallos.length === 1 ? 'pudo' : 'pudieron'} enviar
            <span className="block font-semibold text-text-2 truncate">{fallos[fallos.length - 1]}</span>
          </span>
          <button type="button" onClick={limpiarFallos} className="shrink-0 h-8 px-3 rounded-full border border-line text-[12px] font-extrabold">Entendido</button>
        </div>
      </div>
    );
  }

  if (online && pendientes.length === 0) return null;
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
