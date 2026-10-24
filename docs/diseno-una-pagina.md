# Gasparina (antes Cerebro): diseño en una página

Versión 1, 22 oct 2026. Aprobada por Ronaldo el 22 oct 2026.

## Qué es

Una app en tu celular (APK Android) donde viven **todas** tus tareas, de todas tus áreas, conectada a un "cerebro" en Supabase que Claude puede leer y escribir desde cualquier sesión (celular, web, Claude Code, rutinas automáticas). Claude propone; tú confirmas.

## Para qué, y qué sería un fracaso

- **Para qué:** un solo lugar de verdad. Saber en tres segundos qué toca ahora, de dónde salió cada cosa y cómo va cada frente. Que cada sesión de Claude deje rastro de lo que hizo.
- **Fracasa si:** la IA inventa relaciones o reordena sola; hay que mantener dos lugares; cuesta más de USD 25 al mes; da pereza abrirla por fea o lenta; se pierde el historial.
- **No es:** un Kanban, una lista de recordatorios ni una app de notas.

## Las áreas

Pixely · Trabajo fijo · Trabajos temporales · Universidad · Emprendimientos · Personal. Cada área tiene color y un interruptor "privada" (las privadas no entran en lo que Claude lee desde una sesión de trabajo, salvo que lo pidas).

## Las 4 pantallas

1. **Hoy.** Arriba, 3 cosas "para ahora" (las eliges tú o las propone Claude y tú aceptas). Debajo, el resto del día en una línea de tiempo, con "esta noche" aparte. Un botón grande para capturar, escribiendo o dictando. Cada cosa muestra su área por color.
2. **Bandeja.** Lo capturado sin ordenar. Claude propone a qué área y proyecto va y cuánto importa; tú deslizas y tocas "sí" o corriges.
3. **Mapa.** Área › Proyecto › Tarea con barra de avance. Al abrir una tarea: de dónde nació, de quién cuelga, qué bloquea y qué la bloquea (un mapa pequeño alrededor de esa tarea, nunca un grafo de todo), y su historia: quién cambió qué y cuándo, incluidas las sesiones de Claude.
4. **Claude.** Las sugerencias pendientes (aceptar, posponer, descartar con motivo) y un chat de acción ("arma mi semana", "qué está trabado en Pixely") que siempre termina en una propuesta, nunca en un cambio silencioso.

## Los 5 botones

Cada botón corre una habilidad con un resultado fijo. Los mismos cinco existen como comandos en Claude Code.

| Botón | Qué hace | Qué devuelve |
|---|---|---|
| Plan de hoy | Mira vencimientos, importancia y lo trabado | 3 cosas para ahora + agenda del día, para aceptar |
| Ordenar bandeja | Clasifica lo capturado | Área, proyecto e importancia propuestos para cada cosa |
| Semana | Revisión semanal | Qué avanzó, qué está trabado, qué sobra, con una nota corta |
| Investigar | Recibe un pedido | Un informe corto guardado como ítem tipo "informe", con su origen |
| Ideas | Lee el cerebro | Como máximo 3 ideas, cada una con su razón |

## El cerebro: 6 cajones

`areas` · `sources` (de dónde nació: reunión, sesión de Claude, correo, captura) · `items` (tarea, proyecto, meta, idea, informe o evento; un solo padre; importancia 1 a 5, igual para todas las áreas; fecha límite aparte; hora de inicio, duración y repetición opcionales; código corto tipo `PIX-12`; referencia al ID viejo si vino de la matriz o de Airtable) · `item_links` (depende de, relacionada, nació de, reemplaza; cada enlace con su "por qué") · `item_events` (historial que solo crece: quién, cuándo, antes y después) · `suggestions` (propuestas de Claude con razón, evidencia y estado) · `skills` (el texto de cada botón, una sola copia).

Estados: bandeja, siguiente, en curso, esperando, algún día, hecho, descartado. "Bloqueado" no es un estado: se calcula solo cuando una tarea depende de otra que sigue abierta. Las clases y turnos fijos son ítems tipo "evento" con repetición.

La herencia no se copia: el área y la importancia "efectivas" se calculan al leer subiendo por el padre. Claude no lee tablas crudas: lee fichas cortas de texto con nombres, no códigos internos.

## Cómo entra Claude

Un solo enchufe propio (MCP: el estándar con el que Claude usa herramientas externas), publicado dentro del mismo Supabase, con inicio de sesión OAuth (la pantalla de "permitir acceso") para que cada llamada respete tus permisos. Se registra una vez en claude.ai y aparece en el celular, la web, Claude Code, las sesiones en la nube y las rutinas.

Herramientas: ver contexto, listar, ver tarea, crear, actualizar (con control de versión para que dos sesiones no se pisen), anotar avance (solo agrega), guardar informe, proponer, enlazar. **No hay borrar.**

**Qué escribe Claude directo y qué es sugerencia.** Si tú lo pides en la conversación ("crea esta tarea", "márcala hecha"), se aplica al instante y queda en el historial con la marca "pedido por Ronaldo". Lo que Claude deduce solo (relaciones, importancia, padre, estado, ideas) va a `suggestions` y solo lo aceptado se vuelve real. Anotar avance y guardar un informe son registros de hechos: se escriben directo y nunca cambian el estado de nada.

**Áreas privadas.** No salen por el enchufe salvo que lo pidas en esa conversación. La app y los trabajos programados sí las ven: son tuyos, y lo que la app manda a la API de Anthropic puede incluirlas.

**Dónde corren los botones.** Los 5 botones y los dos trabajos programados corren en una función en la nube de Supabase con la cuenta de API, dentro del tope de gasto. El texto de cada botón vive en la tabla `skills` y el enchufe lo expone a Claude Code y claude.ai como comando: una sola copia. "Investigar" desde la app hace investigaciones cortas con búsqueda web (se cobra aparte por búsqueda); las largas se hacen en Claude Code. Las rutinas de Claude (todavía en prueba) quedan como opción, no como base.

**Trabajos programados:** a las 6:30 a.m. corre "Plan de hoy" y deja la propuesta lista; el domingo a las 7 p.m. corre "Semana".

En los 4 repositorios de Pixely, un gancho de inicio trae las tareas abiertas de ese repo, y un gancho de cierre manda el último mensaje de la sesión al cerebro como avance, por si Claude olvida anotarlo.

## Cómo se construye

React 19 + Tailwind 4 + Capacitor 8, igual que Partners. Supabase nuevo (base, login, funciones en la nube, trabajos programados). Cuenta de API de Anthropic aparte, con tope de gasto: `claude-haiku-5-5` para ordenar y `claude-sonnet-5-5` para pensar. React Flow para el mapa pequeño, Schedule-X para el día, chat propio. APK firmada con una llave guardada fuera del repositorio y respaldada.

## Fases

0. Cuatro pruebas de una hora: el conector desde Android, la respuesta en vivo dentro de la app, la pausa del plan gratis, cuántas veces Claude anota solo en una semana.
1. Cerebro + captura + pantalla Hoy, sin IA todavía.
2. Enchufe de lectura: Claude Code y claude.ai ven el cerebro.
3. Botones, sugerencias y escritura por herramientas.
4. Rutinas y acabado visual.
5. Importar la matriz de Pixely y el Airtable de Festiplast una sola vez (abiertas y hechas, con sus notas como historial y su ID viejo como referencia); apagar los lugares viejos; actualizar los CLAUDE.md de los 4 repos.

**Plan B si la fase 0 sale mal.** Si el enchufe no funciona desde el celular, el asistente dentro de la app no lo necesita (usa la función en la nube) y Claude Code sigue entrando por un archivo de configuración en cada repo; la app sola ya vale la pena. Si Claude no anota solo, el gancho de cierre lo hace por él.

## Decisiones que tomé yo (cámbialas si quieres)

- Nombre: **Gasparina** (decidido el 24 oct 2026; durante el diseño fue "Cerebro", y así sigue llamándose el cerebro de datos y la carpeta del repositorio).
- Sin conexión: siempre se puede leer; lo que edites sin señal se guarda y se envía al volver. Sin servicios extra.
- Obsidian fuera de la v1.
- Supabase: plan gratis. Tu cuenta ya tenía los 2 proyectos activos que permite el plan (pixely_partners y quanta); decidiste el 22 oct 2026 que quanta se pausa y el cerebro usa ese espacio. Se pausa en la fase 1, al crear el proyecto nuevo. Respaldo semanal automático como el de Pixely; Pro cuando pese.
- El tope de USD 25 al mes del criterio de fracaso cubre Supabase + API de Anthropic, no la suscripción de claude.ai que ya pagas. Si hace falta Pro, el total sube a unos USD 30 a 45 y lo aceptamos.
- Sin avisos push al inicio: recordatorios locales y el resumen al abrir. Push en la fase 4 si hace falta.
- Claude nunca cambia padre, importancia o estado por su cuenta, ni siquiera "lo seguro": todo es sugerencia, salvo lo que tú pides en la conversación.
- Tope de la API: USD 20 al mes, con medidor dentro de la app.
- Sin calendario externo (decidido el 22 oct 2026): las clases, turnos y reuniones se cargan como eventos dentro de la app.
- Login con correo y contraseña, un solo usuario, sin registro abierto.
- Un solo padre por tarea; sin etiquetas de varias áreas; sin campos de energía o esfuerzo en la v1.

## Fuera de la v1

iOS · más usuarios · voz local tipo Jarvis en la PC · Mailerfind o prospección · grafo global · edición desde Obsidian.
