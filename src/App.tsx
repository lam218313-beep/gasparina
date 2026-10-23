/**
 * Cada pantalla tiene su propia dirección, así el botón atrás del celular funciona.
 * Entrar, las tres pestañas (Hoy, Bandeja, Mapa) y el detalle de un área.
 */
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { RequireAuth } from './layouts/RequireAuth';
import { DetailLayout, TabsLayout } from './layouts/TabsLayout';
import { EntrarScreen } from './features/entrar/EntrarScreen';
import { HoyScreen } from './features/hoy/HoyScreen';
import { MapaScreen } from './features/mapa/MapaScreen';
import { AreaScreen } from './features/mapa/AreaScreen';
import { ItemScreen } from './features/mapa/ItemScreen';
import { DescartadasScreen } from './features/mapa/DescartadasScreen';
import { BandejaScreen } from './features/bandeja/BandejaScreen';
import { startNativeShell } from './lib/native';
import { RouteError } from '@/ui/ErrorBoundary';

const router = createBrowserRouter([{ errorElement: <RouteError />, children: [
  { path: '/entrar', element: <EntrarScreen /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <TabsLayout />,
        children: [
          { index: true, element: <HoyScreen /> },
          { path: 'bandeja', element: <BandejaScreen /> },
          { path: 'mapa', element: <MapaScreen /> },
        ],
      },
      {
        element: <DetailLayout />,
        children: [
          { path: 'mapa/area/:slug', element: <AreaScreen /> },
          { path: 'mapa/item/:id', element: <ItemScreen /> },
          { path: 'mapa/descartadas', element: <DescartadasScreen /> },
        ],
      },
    ],
  },
] }]);

// Botón atrás de Android: vuelve dentro de la app; en la pantalla principal de una pestaña, sale de la app.
const ROOTS = new Set(['/', '/bandeja', '/mapa', '/entrar']);
void startNativeShell(() => {
  if (ROOTS.has(router.state.location.pathname)) return false;
  void router.navigate(-1);
  return true;
});

export const App: React.FC = () => <RouterProvider router={router} />;
