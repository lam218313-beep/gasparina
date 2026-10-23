import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { ensureDefaultAreas } from '@/lib/cerebro';
import { keys } from '@/lib/queries';

/** Solo con sesión. Mientras se lee la sesión guardada, el fondo vacío (sin parpadeo a Entrar). */
export const RequireAuth: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const ensuredFor = useRef<string | null>(null);

  // La primera vez que entra un dueño, sus seis áreas. Una vez por sesión; sin señal, la app sigue.
  useEffect(() => {
    if (!session || ensuredFor.current === session.user.id) return;
    ensuredFor.current = session.user.id;
    ensureDefaultAreas()
      .then((areas) => queryClient.setQueryData(keys.areas, areas))
      .catch(() => { ensuredFor.current = null; });
  }, [session, queryClient]);

  if (loading) return <div className="min-h-full bg-ink" aria-busy="true" />;
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};
