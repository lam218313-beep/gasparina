/**
 * Cada pantalla tiene su propia dirección, así el botón atrás del celular funciona.
 * Por ahora son tres pestañas vacías; las pantallas de verdad llegan en las tareas siguientes.
 */
import React from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { Screen, TabBar } from '@/ui';
import { RouteError } from '@/ui/ErrorBoundary';

/** El marco de las pestañas: el contenido se desliza y la barra flota encima. */
const Tabs: React.FC = () => (
  <div className="min-h-full">
    <div className="mx-auto max-w-[480px] min-h-full">
      <Outlet />
    </div>
    <TabBar />
  </div>
);

const Pendiente: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <Screen title={title}>
    <p className="m-0 text-[15px] leading-relaxed text-text-2">{text}</p>
  </Screen>
);

const router = createBrowserRouter([{ errorElement: <RouteError />, children: [
  {
    element: <Tabs />,
    children: [
      { index: true, element: <Pendiente title="Hoy" text="Lo que toca ahora y el resto del día." /> },
      { path: 'bandeja', element: <Pendiente title="Bandeja" text="Lo capturado, todavía sin ordenar." /> },
      { path: 'mapa', element: <Pendiente title="Mapa" text="Área, proyecto y tarea." /> },
    ],
  },
] }]);

export const App: React.FC = () => <RouterProvider router={router} />;
