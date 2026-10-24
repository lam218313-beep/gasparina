# Pruebas de la fase 0

Lo que ningún documento resuelve y hay que medir en la vida real. Cada prueba dice qué se midió, con qué, y qué se decide con el resultado.

## 1. Respuesta en vivo dentro de la app (streaming en el WebView)

- **Qué:** la función `prueba-stream` (Supabase, `supabase/functions/prueba-stream`) manda cinco mensajes, uno por segundo. La pantalla `Pruebas` de la app (Mapa › Pruebas, ruta `/debug/stream`) anota en qué milisegundo llegó cada uno, leyendo con `fetch` + `ReadableStream`.
- **Qué decide:** si las cinco líneas llegan separadas (≈1000, 2000, 3000, 4000, 5000 ms), el asistente de la fase 3 puede escribir "en vivo" en el celular. Si llegan todas juntas al final (≈5000 ms), el WebView no transmite en flujo y la fase 3 usa el plan B (la función escribe los trozos en una tabla y la app los recibe por Realtime).
- **Resultado: SÍ llega en vivo.** Fecha: 24 oct 2026, con la APK firmada 1.0 y datos móviles (4.5G/LTE). Llegadas: 2689, 3653, 4652, 5652 y 6655 ms, y el evento final a los 6656 ms: separación de ≈1000 ms entre mensajes, exactamente el ritmo con que la nube los manda. El primero tardó 2,7 s por el arranque en frío de la función. **Decisión:** la fase 3 escribe el asistente en vivo por SSE con `fetch` + `ReadableStream`; el plan B (Realtime) no hace falta. Prueba hecha por Ronaldo; captura en el chat del 24 oct.

## 2. Conector desde el celular (OAuth del enchufe MCP)

- Se mide en la fase 2, cuando exista el enchufe: ¿la app de Claude en Android completa el "permitir acceso" del conector y sobrevive a la renovación del token?
- **Resultado:** _pendiente (fase 2)_.

## 3. Pausa del plan gratis de Supabase

- **Qué:** el proyecto `cerebro` (plan gratis) se pausa si pasa una semana sin actividad. Con uso diario no debería ocurrir.
- **Cómo se mira:** panel de Supabase → estado del proyecto; si dice "Paused", reanudar y anotar la fecha.
- **Resultado:** _en observación desde el 22 oct 2026_.

## 4. ¿Claude anota su avance sin que se lo pidan?

- Se mide en la fase 2, una semana después de instalar el enchufe y los ganchos en los cuatro repos de Pixely: cuántas sesiones dejaron `log_progress` solas y cuántas solo cuando el gancho de cierre lo forzó.
- **Resultado:** _pendiente (fase 2)_.
