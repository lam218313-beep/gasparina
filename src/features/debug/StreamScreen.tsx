import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase';
import { Button, DetailScreen } from '@/ui';

type Estado = 'quieto' | 'corriendo' | 'listo' | 'error';

/**
 * Prueba de la fase 0: pide a la función prueba-stream cinco mensajes (uno por segundo) y anota en
 * qué milisegundo llegó cada uno. Usa fetch + ReadableStream, nunca EventSource (no manda cabeceras
 * y no funciona con CapacitorHttp).
 */
export const StreamScreen: React.FC = () => {
  const { session } = useAuth();
  const [lineas, setLineas] = useState<string[]>([]);
  const [estado, setEstado] = useState<Estado>('quieto');

  const probar = async () => {
    setLineas([]);
    setEstado('corriendo');
    const t0 = performance.now();
    const ms = () => Math.round(performance.now() - t0);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/prueba-stream`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}`, apikey: SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let corte: number;
        while ((corte = buf.indexOf('\n\n')) >= 0) {
          const bloque = buf.slice(0, corte);
          buf = buf.slice(corte + 2);
          const data = bloque.split('\n').find((l) => l.startsWith('data: '))?.slice(6) ?? bloque;
          const llegada = ms();
          setLineas((prev) => [...prev, `${llegada} ms · ${data}`]);
        }
      }
      setEstado('listo');
    } catch (e) {
      setLineas((prev) => [...prev, `Error: ${e instanceof Error ? e.message : String(e)}`]);
      setEstado('error');
    }
  };

  return (
    <DetailScreen back="/mapa" center={<span className="font-display font-extrabold text-[15px]">Prueba en vivo</span>}>
      <p className="m-0 text-[15px] leading-relaxed text-text-2">
        Toca Probar. La nube manda cinco mensajes, uno por segundo. Si aquí aparecen uno por uno (≈1000, 2000, 3000 ms…),
        el celular recibe en vivo. Si aparecen todos juntos al final, no.
      </p>
      <Button block onClick={() => void probar()} loading={estado === 'corriendo'}>Probar</Button>
      <ul aria-label="Llegadas" className="list-none m-0 p-0 flex flex-col gap-1.5 font-mono text-[13px]">
        {lineas.map((l, i) => <li key={i} className="bg-card border border-edge rounded-[12px] px-3 py-2">{l}</li>)}
      </ul>
      {estado === 'listo' && <p className="m-0 text-[13px] font-bold text-text-3">Terminó. Anota los milisegundos en docs/pruebas-fase-0.md.</p>}
    </DetailScreen>
  );
};
