/**
 * Cada pantalla tiene su propia dirección, así el botón atrás del celular funciona.
 * Las tres pestañas todavía son marcadores; las pantallas de verdad llegan en las tareas siguientes.
 */
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { RequireAuth } from './layouts/RequireAuth';
import { TabsLayout } from './layouts/TabsLayout';
import { EntrarScreen } from './features/entrar/EntrarScreen';
import { MapaScreen } from './features/mapa/MapaScreen';
import { AreaScreen } from './features/mapa/AreaScreen';
import { BandejaScreen } from './features/bandeja/BandejaScreen';
import { startNativeShell } from './lib/native';
import { Screen } from '@/ui';
import { RouteError } from '@/ui/ErrorBoundary';

const Pendiente: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <Screen title={title}>
    <p className="m-0 text-[15px] leading-relaxed text-text-2">{text}</p>
  </Screen>
);

const router = createBrowserRouter([{ errorElement: <RouteError />, children: [
  { path: '/entrar', element: <EntrarScreen /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <TabsLayout />,
        children: [
          { index: true, element: <Pendiente title="Hoy" text="Lo que toca ahora y el resto del día." /> },
          { path: 'bandeja', element: <BandejaScreen /> },
          { path: 'mapa', element: <MapaScreen /> },
          { path: 'mapa/area/:slug', element: <AreaScreen /> },
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
