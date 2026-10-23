/**
 * Quién está dentro. Un solo usuario, que entra con correo y contraseña; Supabase guarda la sesión
 * en el celular y la renueva sola. `loading` es verdadero solo mientras se lee la sesión guardada
 * al arrancar, para no mandar a Entrar a quien ya estaba dentro.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Qué le decimos a la persona cuando Supabase rechaza la entrada. */
function mensaje(error: AuthError): string {
  if (error.status === 400 || /invalid login credentials/i.test(error.message)) return 'Correo o contraseña incorrectos';
  if (/fetch|network/i.test(error.message)) return 'Sin conexión. Revisa tu internet.';
  return 'No se pudo entrar. Intenta de nuevo.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    // Solo guardamos la sesión aquí: ninguna otra llamada a Supabase dentro del aviso.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(mensaje(error));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({ session, loading, signIn, signOut }), [session, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}
