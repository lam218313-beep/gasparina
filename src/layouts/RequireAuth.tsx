import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth';

/** Solo con sesión. Mientras se lee la sesión guardada, el fondo vacío (sin parpadeo a Entrar). */
export const RequireAuth: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-full bg-ink" aria-busy="true" />;
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};
