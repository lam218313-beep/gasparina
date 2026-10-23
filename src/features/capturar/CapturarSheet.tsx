import React, { useEffect, useRef, useState } from 'react';
import { limaToIso, todayLima } from '@/lib/dates';
import { useAreas, useCreateItem } from '@/lib/queries';
import { AreaPicker, Button, Field, Sheet, Toast, useToast } from '@/ui';

/** Un interruptor con su etiqueta a la izquierda. */
const Switch: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 h-12 text-[15px] font-bold">
    {label}
    <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="appearance-none w-12 h-7 rounded-full bg-mute checked:bg-pink-fill relative transition before:content-[''] before:absolute before:top-1 before:left-1 before:w-5 before:h-5 before:rounded-full before:bg-white before:transition checked:before:translate-x-5" />
  </label>
);

/**
 * La hoja de captura: escribe (o dicta con el teclado) qué hay que hacer, elige un área si quieres,
 * y guarda. Con área va a "siguiente"; sin área, a la bandeja. Un evento lleva fecha, hora y duración.
 */
export const CapturarSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { data: areas = [] } = useAreas();
  const create = useCreateItem();
  const [toast, showToast] = useToast();
  const [title, setTitle] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [evento, setEvento] = useState(false);
  const [day, setDay] = useState(todayLima());
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [semanal, setSemanal] = useState(false);
  const [vence, setVence] = useState('');
  const [noche, setNoche] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  // La hoja enfoca su panel al abrir; un instante después, el foco pasa al campo para escribir de una.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => campo.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  const reset = () => {
    setTitle(''); setAreaId(null); setEvento(false); setDay(todayLima()); setTime('09:00');
    setDuration(60); setSemanal(false); setVence(''); setNoche(false); setError(null);
  };
  const close = () => { reset(); onClose(); };

  // No se espera a la base: la hoja se cierra al instante y el cambio se envía (o queda en cola sin señal).
  // Si la base lo rechaza, el aviso llega después, en el mismo toast.
  const guardar = () => {
    const t = title.trim();
    if (!t) return;
    setError(null);
    create.mutate(
      {
        id: crypto.randomUUID(),
        title: t,
        kind: evento ? 'evento' : 'tarea',
        areaId,
        status: areaId ? 'siguiente' : 'bandeja',
        evening: noche,
        ...(evento
          ? { startAt: limaToIso(day, time), durationMin: duration, repeatRule: semanal ? 'semanal' as const : null }
          : vence ? { dueAt: limaToIso(vence, '23:59') } : {}),
      },
      { onError: (e) => showToast(`No se pudo guardar: ${e instanceof Error ? e.message : ''}`) },
    );
    close();
    showToast('Guardado');
  };

  return (
    <>
      <Sheet open={open} title="Capturar" onClose={close}>
        <textarea
          ref={campo}
          aria-label="¿Qué hay que hacer?"
          placeholder="¿Qué hay que hacer?"
          enterKeyHint="done"
          rows={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardar(); } }}
          className="w-full rounded-[16px] border border-line bg-ink px-[18px] py-3.5 text-[18px] leading-snug text-white placeholder:text-text-3 outline-none focus:border-pink-text resize-none"
        />
        <AreaPicker areas={areas} value={areaId} onChange={setAreaId} />
        <Switch label="Es un evento" checked={evento} onChange={setEvento} />
        {evento && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            <Field label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <Field label="Duración (min)" type="number" min={5} step={5} inputMode="numeric" value={duration} onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 0))} />
            <div className="flex items-end"><Switch label="Cada semana" checked={semanal} onChange={setSemanal} /></div>
          </div>
        )}
        {!evento && <Field label="Fecha límite" type="date" value={vence} onChange={(e) => setVence(e.target.value)} hint="Opcional" />}
        <Switch label="Esta noche" checked={noche} onChange={setNoche} />
        {error && <p role="alert" className="m-0 text-[13px] font-semibold text-pink-text">{error}</p>}
        <Button type="button" block onClick={guardar} disabled={title.trim() === ''}>
          Guardar
        </Button>
      </Sheet>
      <Toast text={toast} />
    </>
  );
};
