import React, { useState } from 'react';
import { Button, Field, Sheet } from '@/ui';

/**
 * Una hoja mínima para crear algo con solo un título (un proyecto, una tarea dentro de otra).
 * Se cierra al instante: el cambio viaja solo, o espera en cola sin señal.
 */
export const NombreSheet: React.FC<{ open: boolean; title: string; onClose: () => void; onCreate: (titulo: string) => void }> = ({ open, title, onClose, onCreate }) => {
  const [titulo, setTitulo] = useState('');

  const close = () => { setTitulo(''); onClose(); };
  const crear = () => {
    const t = titulo.trim();
    if (!t) return;
    onCreate(t);
    close();
  };

  return (
    <Sheet open={open} title={title} onClose={close}>
      <Field label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} enterKeyHint="done"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); crear(); } }} />
      <Button type="button" block onClick={crear} disabled={titulo.trim() === ''}>Crear</Button>
    </Sheet>
  );
};
