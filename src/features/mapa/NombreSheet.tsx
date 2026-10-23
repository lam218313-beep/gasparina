import React, { useState } from 'react';
import { Button, Field, Sheet } from '@/ui';

/** Una hoja mínima para crear algo con solo un título (un proyecto, una tarea dentro de otra). */
export const NombreSheet: React.FC<{ open: boolean; title: string; onClose: () => void; onCreate: (titulo: string) => Promise<void> }> = ({ open, title, onClose, onCreate }) => {
  const [titulo, setTitulo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => { setTitulo(''); setError(null); onClose(); };
  const crear = async () => {
    const t = titulo.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(t);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} title={title} onClose={close}>
      <Field label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} enterKeyHint="done"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void crear(); } }} />
      {error && <p role="alert" className="m-0 text-[13px] font-semibold text-pink-text">{error}</p>}
      <Button type="button" block onClick={() => void crear()} disabled={titulo.trim() === ''} loading={busy}>Crear</Button>
    </Sheet>
  );
};
