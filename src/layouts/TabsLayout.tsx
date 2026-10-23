import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Plus } from 'lucide-react';
import { OfflineBar, TabBar } from '@/ui';
import { CapturarSheet } from '@/features/capturar/CapturarSheet';

/** El marco de las pestañas: el contenido se desliza, la barra flota encima y el + captura desde cualquier pestaña. */
export const TabsLayout: React.FC = () => {
  const [capturando, setCapturando] = useState(false);
  return (
    <div className="min-h-full">
      <OfflineBar />
      <div className="mx-auto max-w-[480px] min-h-full">
        <Outlet />
      </div>
      <button
        type="button"
        aria-label="Capturar"
        onClick={() => setCapturando(true)}
        className="fixed right-5 bottom-[104px] z-40 w-14 h-14 rounded-full bg-pink-fill text-white shadow-[0_12px_28px_rgba(217,11,102,0.35)] flex items-center justify-center active:scale-95 transition"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
      <TabBar />
      <CapturarSheet open={capturando} onClose={() => setCapturando(false)} />
    </div>
  );
};

/** Las pantallas de detalle (un área, un ítem) van sin barra de pestañas: el botón Volver las saca. */
export const DetailLayout: React.FC = () => (
  <div className="min-h-full">
    <OfflineBar />
    <div className="mx-auto max-w-[480px] min-h-full">
      <Outlet />
    </div>
  </div>
);
