# Gasparina

Gasparina es la app personal de tareas de Ronaldo, con un cerebro en Supabase: capturas, ordenas a mano en la Bandeja, ves el día en Hoy y navegas Área › Proyecto › Tarea en el Mapa.

- Diseño: `docs/diseno-una-pagina.md`
- Plan de la fase 1: `docs/superpowers/plans/2026-10-22-fase-1-cerebro.md`

## Cómo está hecha

Un solo paquete Vite + React 19 + Tailwind 4 + Capacitor 8 (los mismos patrones que la app de Partners) que habla directo con Supabase. El sistema visual es el "Noche" de Partners, con un color por área (`--color-area-*` en `src/styles.css`). Los componentes compartidos están en `src/ui/`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Abre la app en el navegador, con recarga al editar |
| `npm run build` | Revisa los tipos y genera `dist/` |
| `npm run typecheck` | Solo revisa los tipos |
| `npm run test:unit` | Pruebas rápidas de los componentes (Vitest + jsdom), p. ej. `src/ui/Sheet.test.tsx` |
| `npm run test:e2e` | Pruebas de extremo a extremo con Playwright |
| `npm run test:db` | Pruebas de la base con `supabase test db` |
| `npm run cap:sync` / `npm run cap:android` | Construye y sincroniza con Android / abre Android Studio |

## Llaves

Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase, Project Settings, API). `.env`, `.env.e2e` y `android/keystore.properties` están en `.gitignore`: las llaves no se suben al repositorio ni se escriben en el chat.
