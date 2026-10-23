/**
 * Fechas y horas siempre en hora de Lima, pase lo que pase con el reloj del celular.
 */
export const ZONA = 'America/Lima';

/** La fecha de hoy en Lima como `YYYY-MM-DD` (según el reloj del navegador). */
export function todayLima(now: Date = new Date()): string {
  return dayOf(now.toISOString(), now);
}

/** El día (`YYYY-MM-DD`) en Lima de un instante ISO. */
export function dayOf(iso: string, parsed?: Date): string {
  const d = parsed ?? new Date(iso);
  // en-CA escribe las fechas como 2026-10-22.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** `'14:30'` */
export function fmtHour(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

/** `'mié 22 oct'` */
export function fmtDay(iso: string): string {
  const parts = new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value.replace(/\./g, '') ?? '';
  return `${get('weekday')} ${get('day')} ${get('month')}`;
}

/** Un día y una hora de Lima (`'2026-10-22'`, `'15:00'`) como instante ISO. */
export function limaToIso(day: string, time: string): string {
  // Lima no cambia de hora en el año: siempre es UTC-5.
  return new Date(`${day}T${time}:00-05:00`).toISOString();
}
