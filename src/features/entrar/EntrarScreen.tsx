import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Dot, Field } from '@/ui';

/** Entrar con correo y contraseña (un solo usuario, sin registro). */
export const EntrarScreen: React.FC = () => {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-end px-5 pt-safe pb-safe">
      <div className="mx-auto w-full max-w-[480px] flex flex-col gap-8 pb-8">
        <header className="flex flex-col gap-2">
          <span className="font-display font-extrabold text-[22px]">gasparina<Dot /></span>
          <h1 className="font-display font-bold text-[40px] leading-[1.05] m-0">Entrar<Dot /></h1>
          <p className="m-0 text-[15px] leading-relaxed text-text-2">Todas tus tareas, en un solo lugar.</p>
        </header>
        <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
          <Field label="Correo" type="email" autoComplete="username" inputMode="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Contraseña" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" block loading={busy} icon={!busy && <ArrowRight size={18} strokeWidth={2.5} />} className="flex-row-reverse mt-1">
            Entrar
          </Button>
          {error && <p role="alert" className="m-0 text-center text-[13px] font-semibold text-pink-text">{error}</p>}
        </form>
      </div>
    </div>
  );
};
