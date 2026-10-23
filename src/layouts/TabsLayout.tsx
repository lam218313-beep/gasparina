import React from 'react';
import { Outlet } from 'react-router';
import { TabBar } from '@/ui';

/** El marco de las pestañas: el contenido se desliza y la barra flota encima. */
export const TabsLayout: React.FC = () => (
  <div className="min-h-full">
    <div className="mx-auto max-w-[480px] min-h-full">
      <Outlet />
    </div>
    <TabBar />
  </div>
);
