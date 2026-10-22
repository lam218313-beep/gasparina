# Cerebro, fase 1: plan de construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una APK Android donde Ronaldo captura tareas y eventos, los ordena a mano en la Bandeja, ve el día en Hoy y navega Área › Proyecto › Tarea en el Mapa, con todo guardado en un proyecto nuevo de Supabase que registra el historial de cada cambio. Sin IA todavía.

**Architecture:** Un solo paquete Vite + React 19 + Capacitor 8 (mismos patrones que `pixely/frontend/app`) que habla directo con Supabase por `@supabase/supabase-js` bajo RLS de un solo usuario; no hay backend propio. El cerebro son 6 tablas con disparadores (código corto, historial, guardia de ciclos) y funciones SQL (área e importancia efectivas, ruta, vista de hoy) que la app consume por RPC. Pruebas: pgTAP para la base (`supabase test db`) y Playwright contra un Supabase local con datos de semilla.

**Tech Stack:** Node 24 · Vite 8 · React 19.3 · TypeScript 5.8 · Tailwind 4 (`@tailwindcss/vite`) · react-router 7 · TanStack Query 5 (+ persist) · `@supabase/supabase-js` 2 · Supabase CLI ≥ 2.102 con Docker (local) · pgTAP · Playwright 1.56 · Capacitor 8.5 (`@capacitor/android`) · JDK 21 de Android Studio (`C:\Program Files\Android\Android Studio\jbr`) · SDK en `%LOCALAPPDATA%\Android\Sdk`.

**Spec:** `docs/diseno-una-pagina.md`. Este plan cubre la **fase 1** del diseño más la prueba de "respuesta en vivo" de la fase 0. Las otras pruebas de la fase 0 (conector desde Android, cuántas veces Claude anota solo) abren el plan de la fase 2, porque necesitan el enchufe MCP. La pausa del plan gratis se observa, no se construye.

## Global Constraints

- Toda la interfaz en español (es-PE); zona horaria `America/Lima` en app y en SQL.
- Un solo usuario: toda tabla lleva `owner_id uuid not null default auth.uid()` y políticas RLS `owner_id = auth.uid()` para select/insert/update. **Ninguna tabla tiene política de delete**: se descarta con `status = 'descartado'`.
- Nada de llaves ni contraseñas en el chat, en archivos versionados ni en el repositorio: `.env` y `android/keystore.properties` van en `.gitignore`; la llave de firma vive en `D:\1.-Pixely\_respaldos\cerebro-firma\`.
- Estados exactos de `items.status`: `bandeja`, `siguiente`, `en_curso`, `esperando`, `algun_dia`, `hecho`, `descartado`. Tipos exactos de `items.kind`: `tarea`, `proyecto`, `meta`, `idea`, `informe`, `evento`. Importancia: entero de 1 a 5 o nulo. Un solo padre.
- Áreas iniciales y prefijos: Pixely `PIX`, Trabajo fijo `TRA`, Trabajos temporales `TMP`, Universidad `UNI`, Emprendimientos `EMP`, Personal `PER`.
- Repositorio: `D:\1.-Pixely\7.-Cerebro`, rama `main` directa (como pixely_marca), mensajes de commit en español e imperativo, terminados en `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Identificador Android: `pe.lama.cerebro`; nombre visible: `Cerebro`.
- Versiones del Supabase local: las del CLI instalado (2.102.0); no actualizar el CLI en esta fase.

## Review Focus

1. Captura con título vacío o solo espacios: la base la rechaza y la app no deja enviar (pgTAP en tarea 2; e2e en tarea 7).
2. Padre circular (A hijo de B y B hijo de A) o un ítem como su propio padre: el disparador lo rechaza con `ciclo` (tarea 3).
3. "Hoy" al filo de la medianoche: un ítem con `due_at` a las 23:30 de Lima (04:30 UTC del día siguiente) aparece el día correcto (tarea 4).
4. Capturar dos veces sin señal y volver: llegan dos ítems, nunca duplicados ni perdidos; el `id` lo genera el cliente (tarea 10).
5. Reabrir un ítem hecho: `done_at` vuelve a nulo y queda el evento (tarea 3).

---

### Task 1: Repositorio y esqueleto de la app

**Files:**
- Create: `D:\1.-Pixely\7.-Cerebro\` con `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `.gitignore`, `.env.example`, `README.md`
- Create: `docs/diseno-una-pagina.md` (mudado desde pixely_automatizaciones/cerebro/), `docs/superpowers/plans/2026-10-22-fase-1-cerebro.md` (este plan)
- Create: `src/ui/` copiando y adaptando de `pixely/frontend/app/src/ui/`: `Button.tsx`, `Field.tsx`, `Screen.tsx`, `Sheet.tsx`, `Surface.tsx`, `StatusChip.tsx`, `States.tsx`, `TabBar.tsx`, `ErrorBoundary.tsx`, `index.ts`

**Interfaces:**
- Produces: alias `@` → `src/`; `src/styles.css` con el tema "Noche" de Partners (`--color-ink`, `--color-card`, `--color-raised`, `--color-edge`, `--color-text`, `--color-text-2`, `--color-text-3`, fuentes Manrope/Unbounded) más 6 colores de área: `--color-area-pix: #EB0C6E`, `--color-area-tra: #3B82F6`, `--color-area-tmp: #F59E0B`, `--color-area-uni: #8B5CF6`, `--color-area-emp: #10B981`, `--color-area-per: #EC4899`.
- Produces: `TabBar` con `TABS = [{to:'/', label:'Hoy'}, {to:'/bandeja', label:'Bandeja'}, {to:'/mapa', label:'Mapa'}]` (la pestaña Claude llega en la fase 3).

- [ ] **Step 1: Crear el proyecto**

Run: `cd /d/1.-Pixely && npm create vite@latest 7.-Cerebro -- --template react-ts` y luego, dentro, `npm i react-router @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-sync-storage-persister @supabase/supabase-js lucide-react @fontsource/manrope @fontsource/unbounded @capacitor/core @capacitor/android @capacitor/app @capacitor/splash-screen @capacitor/status-bar` y `npm i -D tailwindcss @tailwindcss/vite @capacitor/cli @capacitor/assets @playwright/test @types/node`.
Expected: `package.json` con `"name": "cerebro"`, scripts `dev`, `build` (= `tsc --noEmit && vite build`), `typecheck`, `test:e2e` (= `playwright test`), `test:db` (= `supabase test db`), `cap:sync`, `cap:android` (copiados de Partners).

- [ ] **Step 2: Configurar Vite, alias y Tailwind** igual que `pixely/frontend/app/vite.config.ts` pero sin PWA ni `PIXELY_BASE` (la app vive en la raíz). `src/styles.css`: copiar el bloque `@theme` y `@layer base` de Partners, cambiar el comentario, añadir los 6 colores de área.

- [ ] **Step 3: Copiar los componentes de `src/ui/`** listados arriba, quitando referencias a Partners (`Wordmark` pasa a decir `cerebro`), y `TabBar` con las 3 pestañas e iconos `Sun`, `Inbox`, `Map` de lucide.

- [ ] **Step 4: `.gitignore` y `.env.example`**

`.gitignore`: `node_modules`, `dist`, `*.local`, `.env`, `test-results/`, `playwright-report/`, `android/keystore.properties`, `android/app/release/`, `supabase/.temp/`. `.env.example`: `VITE_SUPABASE_URL=` y `VITE_SUPABASE_PUBLISHABLE_KEY=` con valores vacíos.

- [ ] **Step 5: Mudar los documentos** a `docs/diseno-una-pagina.md` y `docs/superpowers/plans/2026-10-22-fase-1-cerebro.md`; borrar la carpeta `cerebro/` de pixely_automatizaciones (está ignorada por git, no hay commit allá).

- [ ] **Step 6: Verificar**

Run: `npm run build`
Expected: compila sin errores y `dist/index.html` existe.

- [ ] **Step 7: Commit inicial**

```bash
git init -b main && git add -A && git commit -m "Esqueleto de la app Cerebro con el sistema visual de Partners"
```

Ronaldo crea el repositorio privado `lam218313-beep/cerebro` en GitHub (vacío) y se añade como `origin`; el push es de él o con su visto bueno.

---

### Task 2: Supabase local y las 6 tablas con RLS

**Files:**
- Create: `supabase/config.toml` (por `supabase init`), `supabase/migrations/20261022000001_cerebro.sql`, `supabase/seed.sql`, `supabase/tests/01_rls.sql`

**Interfaces:**
- Produces: tablas `public.areas`, `public.sources`, `public.items`, `public.item_links`, `public.item_events`, `public.suggestions`, `public.area_counters`; columnas exactas:
  - `areas(id uuid pk default gen_random_uuid(), owner_id, slug text, name text, color text, prefix text, is_private bool default false, well_being text, created_at timestamptz default now(), unique(owner_id, slug), unique(owner_id, prefix))`
  - `sources(id, owner_id, kind text check in ('reunion','sesion_claude','correo','documento','captura','importacion'), label text, ref text, happened_at timestamptz, created_at)`
  - `items(id uuid pk default gen_random_uuid(), owner_id, kind text default 'tarea' check (lista global), title text check (length(trim(title)) > 0), body text, area_id uuid references areas, parent_id uuid references items, origin_source_id uuid references sources, origin_item_id uuid references items, importance smallint check (importance between 1 and 5), status text default 'bandeja' check (lista global), due_at timestamptz, start_at timestamptz, duration_min int, repeat_rule text, evening bool default false, focus_on date, external_ref text, short_id text, seq int, created_by text default 'user' check in ('user','claude','automation'), version int default 1, created_at, updated_at default now(), done_at timestamptz, unique(owner_id, short_id))`
  - `item_links(id, owner_id, from_id uuid references items, to_id uuid references items, kind text check in ('depende_de','relacionada','nacio_de','reemplaza'), context text, created_by text default 'user', created_at, unique(from_id, to_id, kind), check (from_id <> to_id))`
  - `item_events(id bigserial pk, owner_id, item_id uuid references items, at timestamptz default now(), actor text check in ('user','claude','automation','trigger'), field text, before jsonb, after jsonb, note text, session_ref text)`
  - `suggestions(id, owner_id, kind text, item_id uuid references items, payload jsonb, reason text, evidence text, status text default 'nueva' check in ('nueva','aceptada','descartada','pospuesta'), created_by text default 'claude', created_at, decided_at, decision_note text)`
  - `area_counters(area_id uuid pk references areas, last_seq int default 0)`
- Produces: RLS activado en todas; políticas `select`, `insert` (`with check owner_id = auth.uid()`), `update` por `owner_id = auth.uid()`; **sin** política `delete`. `item_events` solo `select` para el dueño (las escrituras llegan por disparador en la tarea 3).
- Produces: `supabase/seed.sql` con un usuario local de prueba `prueba@cerebro.local` (contraseña `cerebro-local-1234`, solo existe en el Supabase local) insertado en `auth.users` e `auth.identities`, y sus 6 áreas con los prefijos de las restricciones globales.

- [ ] **Step 1: Iniciar Supabase local**

Run: `cd /d/1.-Pixely/7.-Cerebro && supabase init && supabase start`
Expected: imprime `API URL: http://127.0.0.1:54321` y las llaves locales (son públicas por diseño del CLI; no se copian al chat).

- [ ] **Step 2: Escribir la prueba pgTAP `supabase/tests/01_rls.sql`**

Con `select plan(6)`: (a) `has_table` para las 6 tablas; (b) con `set local role authenticated` y `request.jwt.claims` del usuario semilla, `insert into items(title) values ('Probar')` devuelve una fila; (c) con otro `sub` aleatorio, `select count(*) from items` es 0; (d) `delete from items` afecta 0 filas aun siendo el dueño (`throws_ok` o `results_eq` con 0); (e) `insert into items(title) values ('   ')` lanza `violates check constraint`; (f) `insert into items(importance) values (7)` lanza check.

- [ ] **Step 3: Correr la prueba y ver que falla**

Run: `supabase test db`
Expected: FAIL (las tablas no existen).

- [ ] **Step 4: Escribir la migración `20261022000001_cerebro.sql`** con las tablas, restricciones, índices (`items(owner_id, status)`, `items(owner_id, area_id)`, `items(parent_id)`, `item_events(item_id, at desc)`), RLS y políticas de arriba; y `seed.sql` con el usuario y las áreas.

- [ ] **Step 5: Correr la prueba y ver que pasa**

Run: `supabase db reset && supabase test db`
Expected: `01_rls.sql .. ok`, 6/6.

- [ ] **Step 6: Commit**

```bash
git add supabase && git commit -m "Base del cerebro: seis tablas con RLS de un solo dueño y sin borrado"
```

---

### Task 3: Disparadores: código corto, historial y guardia de ciclos

**Files:**
- Create: `supabase/migrations/20261022000002_triggers.sql`, `supabase/tests/02_triggers.sql`

**Interfaces:**
- Produces: `public.assign_short_id()` (trigger `before insert or update of area_id on items`): si `short_id is null` y `area_id is not null`, toma `prefix` del área, crea la fila de `area_counters` si no existe (`insert … on conflict do nothing`), incrementa `last_seq` con `for update` y escribe `short_id = prefix || '-' || seq`, `seq = last_seq`.
- Produces: `public.guard_item_parent()` (`before insert or update of parent_id on items`): lanza `raise exception 'ciclo'` si `parent_id = id` o si `id` está entre los ancestros de `parent_id` (recorrido recursivo, máximo 20 niveles, si pasa de 20 lanza `'demasiada profundidad'`).
- Produces: `public.touch_item()` (`before update on items`): `updated_at = now()`, `version = old.version + 1`; si `status` pasa a `hecho` y `done_at is null` → `done_at = now()`; si sale de `hecho` → `done_at = null`.
- Produces: `public.log_item_change()` (`after insert or update on items`, `security definer`): en insert escribe un evento `field = 'creado'`, `after = to_jsonb(new)`; en update, un evento por cada campo cambiado de la lista `status, importance, parent_id, area_id, title, due_at, start_at, focus_on, kind`, con `before`/`after` del valor y `actor = coalesce(current_setting('cerebro.actor', true), 'user')`.

- [ ] **Step 1: Escribir `02_triggers.sql`** con `plan(8)` como el usuario semilla: (a) insertar un ítem con `area_id` = Pixely → `short_id = 'PIX-1'`; (b) el segundo → `'PIX-2'`; (c) un ítem sin área no tiene `short_id`, y al asignarle área Universidad recibe `'UNI-1'`; (d) `update items set parent_id = id` lanza `ciclo`; (e) A padre de B, luego `update B set parent_id = A`… y `update A set parent_id = B` lanza `ciclo`; (f) pasar a `hecho` llena `done_at` y volver a `siguiente` lo vacía; (g) tras un insert hay exactamente 1 evento `creado`; (h) cambiar `status` e `importance` en un solo update crea 2 eventos con `before`/`after` correctos.

- [ ] **Step 2: Correr y ver que falla**

Run: `supabase test db`
Expected: FAIL en `02_triggers.sql` (sin `short_id`, sin eventos).

- [ ] **Step 3: Escribir la migración** con las 4 funciones y sus triggers. `log_item_change` es `security definer` con `set search_path = public` para poder insertar en `item_events` sin política de insert.

- [ ] **Step 4: Correr y ver que pasa**

Run: `supabase db reset && supabase test db`
Expected: 01 y 02 en ok.

- [ ] **Step 5: Commit**

```bash
git add supabase && git commit -m "Disparadores: código corto por área, historial automático y guardia de ciclos"
```

---

### Task 4: Funciones de lectura: herencia, ruta, progreso y Hoy

**Files:**
- Create: `supabase/migrations/20261022000003_lectura.sql`, `supabase/tests/03_lectura.sql`

**Interfaces:**
- Produces: `public.item_ancestors(p_item uuid) returns table(id uuid, depth int)` (recursivo por `parent_id`, `depth` 1 = padre).
- Produces: `public.effective_area(p_item uuid) returns uuid`: el `area_id` propio o el del ancestro más cercano que lo tenga.
- Produces: `public.effective_importance(p_item uuid) returns smallint`: igual, con `importance`.
- Produces: `public.item_path(p_item uuid) returns text`: `'Pixely › Cliente X › Campaña'` (nombre del área efectiva, luego títulos de ancestros de raíz a padre, separados por `' › '`; sin el propio ítem).
- Produces: `public.project_progress(p_item uuid) returns table(done int, total int)`: descendientes con `kind = 'tarea'`, `done` = los `hecho`.
- Produces: vista `public.v_items` = `items.*` + `effective_area_id`, `effective_importance`, `path`, `area_slug`, `area_color` (de la área efectiva), con `security_invoker = on`.
- Produces: `public.today_items(p_day date) returns table(item_id uuid, bucket text, sort_at timestamptz)` con buckets, en este orden y sin repetir ítem: `'foco'` (`focus_on = p_day`, hasta 3 por importancia efectiva desc), `'noche'` (`evening` y (ocurre en `p_day` o `focus_on = p_day`)), `'agenda'` (ocurre en `p_day`, no evening), `'vence'` (`due_at` cae en `p_day` en Lima). Excluye `hecho` y `descartado`. "Cae en `p_day` en Lima" = `(x at time zone 'America/Lima')::date = p_day`. "Ocurre en `p_day`" = `start_at` cae en `p_day`, **o** `repeat_rule = 'semanal'` y el día de la semana de `start_at` en Lima es el de `p_day` y `start_at` no es posterior a `p_day`; en ese caso `sort_at` = `p_day` con la hora de `start_at` en Lima. (Único valor de `repeat_rule` en esta fase: `'semanal'`; otros ritmos, en la fase 4.)

- [ ] **Step 1: Escribir `03_lectura.sql`** con `plan(8)`: (a) Pixely › proyecto (sin área, padre con área) › tarea: `effective_area(tarea)` = Pixely; (b) `effective_importance` hereda 4 del proyecto cuando la tarea tiene nulo y respeta 2 cuando la tarea lo tiene; (c) `item_path(tarea)` = `'Pixely › Proyecto X'`; (d) `project_progress` = (1, 3) con 3 tareas y 1 hecha; (e) `today_items('2026-10-22')` devuelve en `'vence'` un ítem con `due_at = '2026-10-23 04:30+00'` (23:30 de Lima del 22) y **no** uno con `'2026-10-22 04:30+00'`; (f) 4 ítems con `focus_on` hoy devuelven solo 3 en `'foco'`, los de mayor importancia; (g) un ítem en `foco` con `due_at` hoy aparece una sola vez; (h) un evento `semanal` con `start_at` el jueves 2026-10-15 08:00 Lima aparece en `'agenda'` de `today_items('2026-10-22')` (jueves) con `sort_at = 2026-10-22 13:00+00`, y no aparece en `today_items('2026-10-23')`.

- [ ] **Step 2: Correr y ver que falla**

Run: `supabase test db`
Expected: FAIL en `03_lectura.sql`.

- [ ] **Step 3: Escribir la migración** con las funciones (`language sql stable`, `security invoker`), la vista y `grant execute` a `authenticated`.

- [ ] **Step 4: Correr y ver que pasa**

Run: `supabase db reset && supabase test db`
Expected: 01, 02 y 03 en ok.

- [ ] **Step 5: Generar los tipos para la app**

Run: `supabase gen types typescript --local > src/lib/database.types.ts`
Expected: el archivo exporta `Database` con `public.Tables.items`, `public.Views.v_items` y `public.Functions.today_items`.

- [ ] **Step 6: Commit**

```bash
git add supabase src/lib/database.types.ts && git commit -m "Funciones de lectura: herencia, ruta, progreso y la vista de hoy en hora de Lima"
```

---

### Task 5: Cliente de Supabase, entrar y sesión

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/auth.tsx`, `src/lib/query.ts`, `src/layouts/RequireAuth.tsx`, `src/layouts/TabsLayout.tsx`, `src/features/entrar/EntrarScreen.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `playwright.config.ts`, `e2e/fixtures.ts`, `e2e/entrar.spec.ts`, `.env.e2e`

**Interfaces:**
- Produces: `export const supabase = createClient<Database>(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)` en `src/lib/supabase.ts`.
- Produces: `src/lib/auth.tsx`: `AuthProvider`, `useAuth(): { session: Session | null; loading: boolean; signIn(email: string, password: string): Promise<void>; signOut(): Promise<void> }` sobre `supabase.auth.onAuthStateChange`.
- Produces: `src/lib/query.ts`: `queryClient` (staleTime 60 s, gcTime 24 h, retry 2, `networkMode: 'offlineFirst'` en queries y mutations) y `persister = createSyncStoragePersister({ storage: window.localStorage, key: 'cerebro-cache' })`.
- Produces: rutas `/entrar`, y bajo `RequireAuth` + `TabsLayout`: `/` (Hoy, placeholder), `/bandeja`, `/mapa`.
- Produces: `e2e/fixtures.ts` exporta `test`, `expect` con la opción `signedIn` (por defecto true: inicia sesión por la pantalla Entrar con el usuario semilla antes de cada prueba y guarda `storageState` por worker) y el mismo guardia de Partners (falla si hay `pageerror`, `console.error` o el texto "Algo salió mal").
- Produces: `playwright.config.ts` con `baseURL: http://localhost:4320`, proyecto `android` (Pixel 7), `webServer` = `vite build --mode e2e && vite preview --port 4320`, `locale: es-PE`, `timezoneId: America/Lima`. `.env.e2e` apunta a `http://127.0.0.1:54321` y la llave `anon` local (sale de `supabase status -o env`, no se escribe en el chat).

- [ ] **Step 1: Escribir `e2e/entrar.spec.ts`** (con `signedIn: false`): (a) abrir `/` redirige a `/entrar`; (b) correo y contraseña del usuario semilla → llega a `/` y se ve el título `Hoy.`; (c) contraseña incorrecta muestra `Correo o contraseña incorrectos` y sigue en `/entrar`.

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:e2e -- entrar`
Expected: FAIL (no existe la ruta).

- [ ] **Step 3: Implementar** `supabase.ts`, `auth.tsx`, `query.ts` (envolver la app con `PersistQueryClientProvider`), `RequireAuth` (mientras `loading`, pantalla vacía con el fondo; sin sesión → `/entrar`), `TabsLayout` (`<Outlet/>` + `TabBar`), `EntrarScreen` (título `Entrar.`, campos correo y contraseña, botón `Entrar`, error en rojo bajo el botón) y las rutas en `App.tsx` con el manejo del botón atrás de Android copiado de Partners (`ROOTS = ['/', '/bandeja', '/mapa', '/entrar']`).

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm run test:e2e -- entrar`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Entrar con correo y contraseña, sesión persistente y pruebas de extremo a extremo"
```

---

### Task 6: Capa de datos y áreas iniciales

**Files:**
- Create: `src/lib/types.ts`, `src/lib/cerebro.ts`, `src/lib/queries.ts`, `src/lib/dates.ts`
- Create: `e2e/areas.spec.ts`

**Interfaces:**
- Produces: tipos en `src/lib/types.ts`: `type ItemStatus = 'bandeja'|'siguiente'|'en_curso'|'esperando'|'algun_dia'|'hecho'|'descartado'`; `type ItemKind = 'tarea'|'proyecto'|'meta'|'idea'|'informe'|'evento'`; `type Importance = 1|2|3|4|5`; `type Area = Database['public']['Tables']['areas']['Row']`; `type Item = Database['public']['Views']['v_items']['Row']`; `type ItemEvent = Database['public']['Tables']['item_events']['Row']`; `interface NewItem { id?: string; title: string; kind?: ItemKind; areaId?: string | null; parentId?: string | null; importance?: Importance | null; status?: ItemStatus; dueAt?: string | null; startAt?: string | null; durationMin?: number | null; evening?: boolean; originSourceId?: string | null; originItemId?: string | null; body?: string | null }`; `type ItemPatch = Partial<NewItem> & { focusOn?: string | null; version: number }`.
- Produces: `src/lib/cerebro.ts` (la única puerta a Supabase, como `api.ts` en Partners): `listAreas(): Promise<Area[]>`; `ensureDefaultAreas(): Promise<Area[]>` (inserta las 6 áreas de las restricciones globales si el dueño no tiene ninguna; idempotente); `listItems(filter: { status?: ItemStatus[]; areaId?: string; parentId?: string | null; kind?: ItemKind[] }): Promise<Item[]>` sobre `v_items`; `getItem(id: string): Promise<Item>`; `createItem(input: NewItem): Promise<Item>` (genera `id` con `crypto.randomUUID()` si no viene; inserta en `items` y devuelve `getItem(id)` para traer los campos efectivos de la vista); `updateItem(id: string, patch: ItemPatch): Promise<Item>` (`.eq('version', patch.version)`; si no actualiza ninguna fila lanza `new Error('version')`; devuelve `getItem(id)`); `NewItem` incluye también `repeatRule?: 'semanal' | null`; `listEvents(itemId: string): Promise<ItemEvent[]>` (desc por `at`); `todayItems(day: string): Promise<{ item: Item; bucket: 'foco'|'noche'|'agenda'|'vence' }[]>` (rpc `today_items` + `v_items` por `in`); `projectProgress(id: string): Promise<{ done: number; total: number }>`.
- Produces: `src/lib/dates.ts`: `todayLima(): string` (`YYYY-MM-DD` en `America/Lima`), `fmtHour(iso: string): string` (`'14:30'`), `fmtDay(iso: string): string` (`'mié 22 oct'`).
- Produces: hooks en `src/lib/queries.ts` con claves `['areas']`, `['items', filter]`, `['item', id]`, `['events', id]`, `['today', day]`: `useAreas()`, `useItems(filter)`, `useItem(id)`, `useEvents(id)`, `useToday(day)`, `useCreateItem()`, `useUpdateItem()`. Las mutaciones invalidan `['items']`, `['today']`, `['item', id]`, `['events', id]`; `useUpdateItem` hace actualización optimista de `['item', id]`.

- [ ] **Step 1: Escribir `e2e/areas.spec.ts`**: tras entrar por primera vez con un usuario nuevo creado para la prueba (vía la API admin local en el `beforeAll`, con la llave `service_role` local leída de `supabase status -o env`), existen 6 áreas en la pestaña Mapa en este orden: Pixely, Trabajo fijo, Trabajos temporales, Universidad, Emprendimientos, Personal.

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:e2e -- areas`
Expected: FAIL (Mapa vacío).

- [ ] **Step 3: Implementar** `types.ts`, `dates.ts`, `cerebro.ts`, `queries.ts`; `RequireAuth` llama `ensureDefaultAreas()` una vez por sesión; `MapaScreen` provisional que lista `useAreas()` por nombre.

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm run test:e2e -- areas`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Capa de datos del cerebro y las seis áreas iniciales"
```

---

### Task 7: Capturar y Bandeja

**Files:**
- Create: `src/features/capturar/CapturarSheet.tsx`, `src/features/bandeja/BandejaScreen.tsx`, `src/features/bandeja/BandejaCard.tsx`, `src/ui/AreaChip.tsx`, `src/ui/ImportanceDots.tsx`
- Modify: `src/layouts/TabsLayout.tsx` (botón flotante `+` sobre la barra, abre la hoja desde cualquier pestaña)
- Create: `e2e/capturar.spec.ts`

**Interfaces:**
- Produces: `CapturarSheet({ open, onClose }: { open: boolean; onClose: () => void })`: campo de texto grande (placeholder `¿Qué hay que hacer?`, `enterKeyHint="done"`, el dictado lo pone el teclado de Android), fila de chips de área (opcional), toggle `Es un evento` que muestra fecha, hora, duración (minutos, por defecto 60) y el toggle `Cada semana` (`repeatRule: 'semanal'`), toggle `Esta noche`, botón `Guardar`. Guardar llama `useCreateItem()` con `status: areaId ? 'siguiente' : 'bandeja'`, `kind: evento ? 'evento' : 'tarea'`; deshabilitado si `title.trim() === ''`; al guardar cierra y muestra el aviso `Guardado` 1,5 s.
- Produces: `BandejaScreen`: título `Bandeja.`, lista de `useItems({ status: ['bandeja'] })` como `BandejaCard`; vacío: `Nada por ordenar.`
- Produces: `BandejaCard({ item })`: título, `AreaChip` selector (las 6 áreas), `ImportanceDots` (1 a 5, tocar fija), botones `Siguiente`, `Algún día`, `Descartar`. Cada acción llama `useUpdateItem()` con `{ version: item.version, ... }`; `Siguiente` exige área (si no hay, resalta los chips con el texto `Elige un área`).
- Produces: `AreaChip({ area, selected, onSelect })` con el color del área; `ImportanceDots({ value, onChange })`.

- [ ] **Step 1: Escribir `e2e/capturar.spec.ts`**: (a) tocar `+`, escribir `Llamar al banco`, Guardar → aparece en Bandeja; (b) con solo espacios el botón Guardar está deshabilitado; (c) en Bandeja elegir área Universidad, importancia 4 y `Siguiente` → desaparece de Bandeja y en Mapa › Universidad aparece con código `UNI-1`; (d) capturar con área Pixely desde la hoja → no pasa por Bandeja y aparece en Mapa › Pixely; (e) `Siguiente` sin área muestra `Elige un área` y no mueve el ítem; (f) capturar como evento hoy 15:00 → el ítem tiene `kind = evento` (se ve en Hoy en la tarea 8; aquí basta con que aparezca en Mapa › área con la hora `15:00`).

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:e2e -- capturar`
Expected: FAIL.

- [ ] **Step 3: Implementar** los componentes de arriba; `Sheet` de Partners para la hoja; la lista de Mapa › área mínima que haga falta para la aserción (se completa en la tarea 9).

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm run test:e2e -- capturar`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Capturar desde cualquier pantalla y ordenar la bandeja a mano"
```

---

### Task 8: Hoy

**Files:**
- Create: `src/features/hoy/HoyScreen.tsx`, `src/features/hoy/FocoCard.tsx`, `src/features/hoy/Agenda.tsx`, `src/features/hoy/ElegirFocoSheet.tsx`
- Create: `e2e/hoy.spec.ts`

**Interfaces:**
- Consumes: `useToday(todayLima())`, `useItems({ status: ['siguiente','en_curso','esperando'] })`, `useUpdateItem()`.
- Produces: `HoyScreen`: título `Hoy.` con la fecha `fmtDay` debajo; bloque **Para ahora** con hasta 3 `FocoCard` (si hay menos de 3, un botón `Elegir` abre `ElegirFocoSheet`); bloque **Agenda** (`Agenda` con los ítems `agenda` ordenados por `start_at`, cada uno con hora y duración, los `vence` al final con la etiqueta `Vence hoy`); bloque **Esta noche** con los `noche`. Vacío total: `Día libre. Captura algo con +`.
- Produces: `FocoCard({ item })`: título, área por color, código corto, botón circular `Hecho` (actualiza `status: 'hecho'`) y `Quitar` (pone `focusOn: null`).
- Produces: `ElegirFocoSheet({ open, onClose })`: lista de ítems abiertos agrupados por área, ordenados por importancia efectiva desc y `due_at` asc; tocar uno hace `updateItem(id, { focusOn: todayLima(), version })` y cierra; no deja elegir un cuarto (muestra `Ya tienes 3 para ahora`).

- [ ] **Step 1: Escribir `e2e/hoy.spec.ts`**: (a) con la base limpia, Hoy muestra `Día libre`; (b) capturar un evento hoy 15:00 de 30 min y otro 09:00 → Agenda los muestra en orden `09:00`, `15:00`; (c) elegir 3 ítems para ahora muestra 3 `FocoCard` y el botón `Elegir` desaparece; intentar un cuarto muestra `Ya tienes 3 para ahora`; (d) tocar `Hecho` en una tarjeta la saca de Para ahora y en Mapa el ítem figura como hecho; (e) un evento marcado `Esta noche` aparece en Esta noche y no en Agenda; (f) una tarea con fecha límite hoy aparece con `Vence hoy`; (g) un evento `Cada semana` creado hoy a las 08:00 aparece en Agenda hoy y, con el reloj de la prueba adelantado 7 días (`page.clock.setFixedTime`), también aparece; adelantado 8 días, no.

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:e2e -- hoy`
Expected: FAIL.

- [ ] **Step 3: Implementar** los componentes; la agenda es una lista vertical con la hora a la izquierda y una línea con el color del área (no un calendario de rejilla).

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm run test:e2e -- hoy`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Pantalla Hoy: para ahora, agenda, esta noche y lo que vence"
```

---

### Task 9: Mapa y ficha del ítem con historial

**Files:**
- Create: `src/features/mapa/MapaScreen.tsx`, `src/features/mapa/AreaScreen.tsx`, `src/features/mapa/ItemScreen.tsx`, `src/features/mapa/ItemRow.tsx`, `src/features/mapa/Historial.tsx`, `src/features/mapa/EditarSheet.tsx`
- Modify: `src/App.tsx` (rutas `mapa/area/:slug` y `mapa/item/:id` bajo un `DetailLayout` sin barra)
- Create: `e2e/mapa.spec.ts`

**Interfaces:**
- Consumes: `useAreas()`, `useItems(...)`, `useItem(id)`, `useEvents(id)`, `projectProgress`, `useUpdateItem()`, `useCreateItem()`.
- Produces: `MapaScreen`: título `Mapa.`; una tarjeta por área con su color, nombre, cuántos ítems abiertos y cuántos proyectos; tocar abre `/mapa/area/:slug`.
- Produces: `AreaScreen`: nombre del área; sección **Proyectos** (ítems `kind = proyecto` del área con barra de progreso `done/total`) y **Sueltas** (tareas sin padre); botón `Nuevo proyecto` (crea `kind: 'proyecto'`, `status: 'en_curso'`, con `areaId`). Tocar un ítem abre `/mapa/item/:id`.
- Produces: `ItemScreen`: `DetailScreen` con el código corto al centro; ruta (`item.path`) en gris arriba del título; chips de estado (menú para cambiar entre los 7 estados), importancia (`ImportanceDots`), fecha límite, hora si es evento; bloque **Nació de** (fuente u ítem de origen, o `Captura manual`); bloque **Dentro** (hijos como `ItemRow`, botón `Añadir tarea` que crea con `parentId`); bloque **Historial** (`Historial`). Botón `Editar` abre `EditarSheet` (título, cuerpo, padre por búsqueda de título, fecha, hora).
- Produces: `Historial({ events })`: una línea por evento, `fmtDay` + hora, actor (`Tú`, `Claude`, `Automático`), y el cambio en palabras: `Estado: bandeja → siguiente`, `Importancia: — → 4`, `Creado`.
- Produces: `ItemRow({ item })`: título, código, puntos de importancia, estado como `StatusChip`.

- [ ] **Step 1: Escribir `e2e/mapa.spec.ts`**: (a) Mapa lista las 6 áreas; (b) en Pixely, `Nuevo proyecto` "Campaña Casa Norte" aparece en Proyectos con `0/0`; (c) dentro del proyecto, `Añadir tarea` dos veces y marcar una `hecho` → el proyecto muestra `1/2` en AreaScreen; (d) la ficha de la tarea muestra la ruta `Pixely › Campaña Casa Norte` y el código `PIX-2`; (e) el Historial de esa tarea muestra `Creado` y `Estado: siguiente → hecho`; (f) cambiar el padre de la tarea a sí misma por `EditarSheet` no es posible (no aparece en la búsqueda de padres) y mover el proyecto dentro de su propia tarea muestra el error `No puede quedar dentro de sí mismo` (la base lanza `ciclo`).

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:e2e -- mapa`
Expected: FAIL.

- [ ] **Step 3: Implementar** los componentes; el error `ciclo` de Supabase se traduce en `cerebro.ts` a `new Error('No puede quedar dentro de sí mismo')`.

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm run test:e2e -- mapa`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Mapa por áreas y proyectos, ficha del ítem con origen e historial"
```

---

### Task 10: Sin conexión: caché persistente y cambios en cola

**Files:**
- Modify: `src/lib/query.ts`, `src/main.tsx`, `src/lib/queries.ts`
- Create: `src/ui/OfflineBar.tsx`, `e2e/offline.spec.ts`

**Interfaces:**
- Produces: `PersistQueryClientProvider` con `persistOptions: { persister, maxAge: 24h, dehydrateOptions: { shouldDehydrateMutation: () => true } }` y `onSuccess: () => queryClient.resumePausedMutations()`; `useCreateItem` y `useUpdateItem` definen `mutationKey` y `setMutationDefaults` para que las mutaciones en cola sobrevivan al cierre de la app.
- Produces: `OfflineBar`: franja `Sin conexión: tus cambios se enviarán al volver` cuando `onlineManager.isOnline()` es falso, con el número de cambios en cola (`queryClient.getMutationCache().getAll().filter(m => m.state.isPaused).length`).

- [ ] **Step 1: Escribir `e2e/offline.spec.ts`**: (a) con `context.setOffline(true)`, capturar `Uno` y `Dos` → ambos aparecen en Bandeja de inmediato y la franja dice `2 cambios`; (b) `setOffline(false)` → la franja desaparece y, tras recargar la página, Bandeja sigue mostrando exactamente `Uno` y `Dos` (una vez cada uno); (c) marcar importancia sin señal, volver, recargar → la importancia persiste.

- [ ] **Step 2: Correr y ver que falla**

Run: `npm run test:e2e -- offline`
Expected: FAIL (sin señal, la captura falla o se pierde al recargar).

- [ ] **Step 3: Implementar** según las interfaces; la captura optimista inserta en la caché de `['items', { status: ['bandeja'] }]` con el `id` generado por el cliente.

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm run test:e2e -- offline`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Funciona sin señal: caché persistente y cambios en cola que se envían al volver"
```

---

### Task 11: El Supabase real: pausar quanta, crear el proyecto, publicar la base

**Files:**
- Create: `.env` (local, ignorado), `docs/operacion.md`, `.github/workflows/respaldo-base.yml`

**Interfaces:**
- Produces: proyecto Supabase `cerebro` (organización `vercel_icfg_X2EkTR9MTz3h3Z4DODmUEPbo`, región `us-east-1`, plan gratis) con las 3 migraciones aplicadas; registro abierto de usuarios desactivado; un usuario creado por Ronaldo en el panel (correo y contraseña suyos, nunca por el chat).
- Produces: `docs/operacion.md`: cómo correr local, cómo publicar migraciones (`supabase db push`), dónde vive la llave de firma, cómo restaurar un respaldo.

- [ ] **Step 1: Pausar quanta** con la herramienta `pause_project` del MCP de Supabase (`nuuqkwdopdsgokiziyum`), con el visto bueno ya dado el 22 oct 2026. Verificar con `list_projects` que su estado ya no es `ACTIVE_HEALTHY`.

- [ ] **Step 2: Crear el proyecto** `cerebro` con `get_cost` → `confirm_cost` → `create_project` del MCP (plan gratis, `us-east-1`); la contraseña de la base la genera la herramienta y no se repite en el chat. Anotar el `ref` en `docs/operacion.md`.

- [ ] **Step 3: Vincular y publicar**

Run: `supabase link --project-ref <ref> && supabase db push`
Expected: `Applying migration 20261022000001…` ×3 y `Finished supabase db push`.

- [ ] **Step 4: Ajustes en el panel (Ronaldo):** Authentication → Sign In / Providers → desactivar "Allow new users to sign up"; Authentication → Users → Add user con su correo y una contraseña que solo él conoce. Pegar en `.env` local la URL y la llave `publishable` del proyecto (Settings → API Keys).

- [ ] **Step 5: Verificar en la web**

Run: `npm run build && npx vite preview --port 4330`
Expected: en el navegador, entrar con su usuario funciona y Mapa muestra las 6 áreas (creadas por `ensureDefaultAreas`).

- [ ] **Step 6: Respaldo semanal**: copiar `respaldo-base.yml` del repo pixely adaptando nombres; el secreto `SUPABASE_DB_URL` lo pega Ronaldo en GitHub → Settings → Secrets (nunca en el repo). Verificar con "Run workflow" que sube un `.sql` al artefacto.

- [ ] **Step 7: Commit**

```bash
git add docs/operacion.md .github && git commit -m "Operación: proyecto real de Supabase, cómo publicar la base y respaldo semanal"
```

---

### Task 12: APK firmada e instalada en el celular

**Files:**
- Create: `capacitor.config.ts`, `android/` (por `cap add`), `android/keystore.properties` (ignorado), `resources/icon.png`, `resources/splash.png`
- Modify: `android/app/build.gradle` (bloque `signingConfigs.release` leyendo `keystore.properties`), `android/local.properties` (ignorado, `sdk.dir`)

**Interfaces:**
- Produces: `capacitor.config.ts` igual al de Partners con `appId: 'pe.lama.cerebro'`, `appName: 'Cerebro'`, `webDir: 'dist'`, `backgroundColor: '#0A0A0C'`, y `server.androidScheme: 'https'`.
- Produces: `app-release.apk` firmada en `android/app/build/outputs/apk/release/`.

- [ ] **Step 1: Añadir Android**

Run: `npm run build && npx cap add android && npx cap sync`
Expected: carpeta `android/` con `app/build.gradle` cuyo `applicationId` es `pe.lama.cerebro`.

- [ ] **Step 2: Icono y pantalla de arranque**: `npm i -D sharp` y `scripts/iconos.mjs` que genera `resources/icon.png` (1024×1024: un círculo rosa `#EB0C6E` de 560 px de diámetro centrado sobre `#0A0A0C`) y `resources/splash.png` (2732×2732, fondo `#0A0A0C`, el mismo círculo de 400 px); luego `npx capacitor-assets generate --android`.

- [ ] **Step 3: Llave de firma (Ronaldo, en su terminal, no por el chat)**

```bash
mkdir -p "/d/1.-Pixely/_respaldos/cerebro-firma" && "/c/Program Files/Android/Android Studio/jbr/bin/keytool" -genkeypair -v -keystore "/d/1.-Pixely/_respaldos/cerebro-firma/cerebro.jks" -alias cerebro -keyalg RSA -keysize 2048 -validity 10000
```

Luego escribe `android/keystore.properties` con `storeFile=D:/1.-Pixely/_respaldos/cerebro-firma/cerebro.jks`, `storePassword=…`, `keyAlias=cerebro`, `keyPassword=…`, y copia la carpeta `cerebro-firma` a su Drive. Sin esa llave no hay actualizaciones futuras de la app instalada.

- [ ] **Step 4: Firma en Gradle**: en `android/app/build.gradle` leer `keystore.properties` si existe y definir `signingConfigs.release`; `buildTypes.release.signingConfig = signingConfigs.release`. `android/local.properties`: `sdk.dir=C:\\Users\\Ronaldo\\AppData\\Local\\Android\\Sdk`.

- [ ] **Step 5: Construir**

Run: `cd android && JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew assembleRelease`
Expected: `BUILD SUCCESSFUL` y `app/build/outputs/apk/release/app-release.apk`.

- [ ] **Step 6: Instalar** con el celular en modo depuración USB: `"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb" install -r android/app/build/outputs/apk/release/app-release.apk`; si no hay cable, enviar el `.apk` por Drive y abrirlo en el celular.
Expected: la app abre, entra con su usuario y captura un ítem que aparece en el panel de Supabase (Table Editor → items).

- [ ] **Step 7: Commit**

```bash
git add capacitor.config.ts android resources && git commit -m "Android: proyecto Capacitor, icono, firma de la APK fuera del repositorio"
```

---

### Task 13: Prueba de la fase 0: respuesta en vivo dentro de la app

**Files:**
- Create: `supabase/functions/prueba-stream/index.ts`, `src/features/debug/StreamScreen.tsx`, `docs/pruebas-fase-0.md`
- Modify: `src/App.tsx` (ruta `/debug/stream`, sin enlace en la barra)

**Interfaces:**
- Produces: Edge Function `prueba-stream`: responde `text/event-stream` con 5 eventos `data: {"n":1,"t":<ms>}` … separados por 1 s y un `event: done`; `verify_jwt` activado (acepta la sesión del usuario).
- Produces: `StreamScreen`: botón `Probar`; usa `fetch(url, { headers: { Authorization: 'Bearer ' + session.access_token }, method: 'POST' })` y `response.body.getReader()` (nunca `EventSource`); muestra una línea por evento con el instante de llegada en milisegundos desde el toque.

- [ ] **Step 1: Desplegar la función**

Run: `supabase functions deploy prueba-stream`
Expected: URL de la función en la salida.

- [ ] **Step 2: Implementar `StreamScreen`** y reconstruir la APK (tarea 12, pasos 5 y 6).

- [ ] **Step 3: Probar en el celular** (Ronaldo): abrir `/debug/stream` desde la pantalla de cuenta (enlace discreto `Pruebas`), tocar `Probar`.
Expected: las 5 líneas llegan **una por segundo** (≈1000, 2000, 3000, 4000, 5000 ms). Si llegan todas juntas a los ~5000 ms, el WebView no transmite en vivo: anotar el resultado y, en la fase 3, usar el plan B (Realtime).

- [ ] **Step 4: Registrar el resultado** en `docs/pruebas-fase-0.md` con fecha, modelo de celular, versión de Android y los milisegundos observados.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Prueba de la fase 0: respuesta en vivo dentro de la app"
```

---

## Lo que queda para los planes siguientes

- **Fase 2:** enchufe MCP propio (Edge Function con el SDK de MCP, Supabase Auth como servidor OAuth; requiere actualizar el CLI a ≥ 2.117), herramientas de solo lectura, `item_card` y `brain_search`, conector en claude.ai, prueba desde el celular con la app de Claude, ganchos de inicio y cierre en los 4 repos de Pixely, y la medición de "cuántas veces Claude anota solo".
- **Fase 3:** tabla `skills`, los 5 botones (función en la nube con la cuenta de API), `suggestions` en la pantalla Claude, escritura por herramientas con confirmación, chat de acción, enlaces `depende_de` con el "bloqueado" calculado.
- **Fase 4:** trabajos programados (`pg_cron`), recordatorios locales, otros ritmos de repetición, acabado visual (animaciones de `transform`/`opacity`, mapa local de dependencias con React Flow), pantalla de cuenta.
- **Fase 5:** importación de la matriz de Pixely y del Airtable de Festiplast; actualización de los CLAUDE.md.
