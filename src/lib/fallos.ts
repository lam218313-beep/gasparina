/**
 * Los cambios que la base rechazó cuando ya nadie los estaba mirando (por ejemplo, uno que quedó en
 * cola sin señal y se envió al abrir la app otro día). Se guardan en el celular hasta que la persona
 * los vea y los descarte; la franja de arriba (OfflineBar) los muestra.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'cerebro-fallos';
const MAXIMO = 20;

function leer(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const lista: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

let fallos: string[] = leer();
const listeners = new Set<() => void>();

function publicar() {
  try { localStorage.setItem(KEY, JSON.stringify(fallos)); } catch { /* sin almacenamiento: se queda en memoria */ }
  listeners.forEach((l) => l());
}

export function registrarFallo(texto: string): void {
  fallos = [...fallos, texto].slice(-MAXIMO);
  publicar();
}

export function limpiarFallos(): void {
  fallos = [];
  publicar();
}

export function listarFallos(): string[] {
  return fallos;
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useFallos(): string[] {
  return useSyncExternalStore(subscribe, listarFallos);
}
