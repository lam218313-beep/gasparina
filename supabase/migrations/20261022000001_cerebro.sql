-- Cerebro, fase 1: las tablas del cerebro con seguridad por fila (RLS) de un solo dueño.
--
-- Reglas que valen para todas las tablas:
--   * Cada fila lleva owner_id (por defecto, quien hace la petición: auth.uid()),
--     apuntando a auth.users SIN borrado en cascada: si alguien borra al usuario en el
--     panel de Supabase, la base lo rechaza mientras tenga datos, en vez de llevárselos.
--     (area_counters es la excepción: no lleva owner_id, cuelga de su área.)
--   * RLS activo: el dueño ve, crea y edita lo suyo; nadie más ve nada.
--   * No hay política de delete: nada se borra, se descarta con status = 'descartado'.
--     Tampoco hay privilegio de DELETE ni de TRUNCATE (ver "Privilegios" al final).
--   * item_events y area_counters no tienen política de escritura: solo las llenan
--     los disparadores (security definer) que llegan en la migración siguiente.

-- ---------------------------------------------------------------------------
-- areas: las áreas de la vida (Pixely, Universidad, ...), con su prefijo de código
-- ---------------------------------------------------------------------------
create table public.areas (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id),
  slug        text not null,
  name        text not null,
  color       text not null,
  prefix      text not null,
  is_private  boolean not null default false,
  well_being  text,
  created_at  timestamptz not null default now(),
  constraint areas_owner_slug_key unique (owner_id, slug),
  constraint areas_owner_prefix_key unique (owner_id, prefix)
);

-- ---------------------------------------------------------------------------
-- sources: de dónde nació algo (reunión, sesión de Claude, correo, ...)
-- ---------------------------------------------------------------------------
create table public.sources (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id),
  kind         text not null,
  label        text,
  ref          text,
  happened_at  timestamptz,
  created_at   timestamptz not null default now(),
  constraint sources_kind_check check (
    kind in ('reunion', 'sesion_claude', 'correo', 'documento', 'captura', 'importacion')
  )
);

-- ---------------------------------------------------------------------------
-- items: tareas, proyectos, metas, ideas, informes y eventos (un solo padre)
-- ---------------------------------------------------------------------------
create table public.items (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users (id),
  kind              text not null default 'tarea',
  title             text not null,
  body              text,
  area_id           uuid references public.areas (id),
  parent_id         uuid references public.items (id),
  origin_source_id  uuid references public.sources (id),
  origin_item_id    uuid references public.items (id),
  importance        smallint,
  status            text not null default 'bandeja',
  due_at            timestamptz,
  start_at          timestamptz,
  duration_min      integer,
  repeat_rule       text,
  evening           boolean not null default false,
  focus_on          date,
  external_ref      text,
  short_id          text,
  seq               integer,
  created_by        text not null default 'user',
  version           integer not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  done_at           timestamptz,
  constraint items_owner_short_id_key unique (owner_id, short_id),
  constraint items_kind_check check (
    kind in ('tarea', 'proyecto', 'meta', 'idea', 'informe', 'evento')
  ),
  constraint items_title_not_blank check (length(trim(title)) > 0),
  constraint items_importance_range check (importance between 1 and 5),
  constraint items_status_check check (
    status in ('bandeja', 'siguiente', 'en_curso', 'esperando', 'algun_dia', 'hecho', 'descartado')
  ),
  constraint items_created_by_check check (created_by in ('user', 'claude', 'automation'))
);

create index items_owner_status_idx on public.items (owner_id, status);
create index items_owner_area_idx   on public.items (owner_id, area_id);
create index items_parent_idx       on public.items (parent_id);

-- ---------------------------------------------------------------------------
-- item_links: relaciones entre ítems, cada una con su "por qué"
-- ---------------------------------------------------------------------------
create table public.item_links (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id),
  from_id     uuid not null references public.items (id),
  to_id       uuid not null references public.items (id),
  kind        text not null,
  context     text,
  created_by  text not null default 'user',
  created_at  timestamptz not null default now(),
  constraint item_links_from_to_kind_key unique (from_id, to_id, kind),
  constraint item_links_kind_check check (
    kind in ('depende_de', 'relacionada', 'nacio_de', 'reemplaza')
  ),
  constraint item_links_not_self check (from_id <> to_id)
);

-- ---------------------------------------------------------------------------
-- item_events: el historial, que solo crece (lo escriben los disparadores)
-- ---------------------------------------------------------------------------
create table public.item_events (
  id           bigserial primary key,
  owner_id     uuid not null default auth.uid() references auth.users (id),
  item_id      uuid not null references public.items (id),
  at           timestamptz not null default now(),
  actor        text not null,
  field        text not null,
  before       jsonb,
  after        jsonb,
  note         text,
  session_ref  text,
  constraint item_events_actor_check check (actor in ('user', 'claude', 'automation', 'trigger'))
);

create index item_events_item_at_idx on public.item_events (item_id, at desc);

-- ---------------------------------------------------------------------------
-- suggestions: propuestas de Claude con su razón, que el dueño acepta o descarta
-- ---------------------------------------------------------------------------
create table public.suggestions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id),
  kind           text not null,
  item_id        uuid references public.items (id),
  payload        jsonb,
  reason         text,
  evidence       text,
  status         text not null default 'nueva',
  created_by     text not null default 'claude',
  created_at     timestamptz not null default now(),
  decided_at     timestamptz,
  decision_note  text,
  constraint suggestions_status_check check (
    status in ('nueva', 'aceptada', 'descartada', 'pospuesta')
  )
);

-- ---------------------------------------------------------------------------
-- area_counters: el último número usado por área (lo mueve el disparador del código corto)
-- ---------------------------------------------------------------------------
create table public.area_counters (
  area_id   uuid primary key references public.areas (id),
  last_seq  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Seguridad por fila
-- ---------------------------------------------------------------------------
alter table public.areas         enable row level security;
alter table public.sources       enable row level security;
alter table public.items         enable row level security;
alter table public.item_links    enable row level security;
alter table public.item_events   enable row level security;
alter table public.suggestions   enable row level security;
alter table public.area_counters enable row level security;

-- Tablas donde el dueño ve, crea y edita lo suyo (sin delete).
-- (select auth.uid()) en vez de auth.uid() para que Postgres lo calcule una vez por consulta.
create policy areas_select on public.areas
  for select to authenticated using (owner_id = (select auth.uid()));
create policy areas_insert on public.areas
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy areas_update on public.areas
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy sources_select on public.sources
  for select to authenticated using (owner_id = (select auth.uid()));
create policy sources_insert on public.sources
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy sources_update on public.sources
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy items_select on public.items
  for select to authenticated using (owner_id = (select auth.uid()));
create policy items_insert on public.items
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy items_update on public.items
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy item_links_select on public.item_links
  for select to authenticated using (owner_id = (select auth.uid()));
create policy item_links_insert on public.item_links
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy item_links_update on public.item_links
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy suggestions_select on public.suggestions
  for select to authenticated using (owner_id = (select auth.uid()));
create policy suggestions_insert on public.suggestions
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy suggestions_update on public.suggestions
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Solo lectura para el dueño: las escrituras llegan por disparadores security definer.
create policy item_events_select on public.item_events
  for select to authenticated using (owner_id = (select auth.uid()));

-- area_counters no tiene owner_id: el dueño la ve a través de su área.
create policy area_counters_select on public.area_counters
  for select to authenticated using (
    exists (
      select 1 from public.areas a
      where a.id = area_counters.area_id and a.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Privilegios (GRANT): la segunda capa, debajo de RLS.
-- ---------------------------------------------------------------------------
-- Sin esto las tablas dan 42501 (permission denied) en la nube: la nube ya no reparte permisos
-- solas a las tablas nuevas, y el local tampoco (config.toml: auto_expose_new_tables = false).
-- RLS decide qué filas ve cada dueño; los privilegios deciden qué operaciones existen.
--
-- Primero se quita todo a anon y authenticated (aunque la configuración no reparta SELECT,
-- INSERT, UPDATE ni DELETE solos, el Postgres de Supabase deja TRUNCATE, REFERENCES y TRIGGER
-- a esos roles, y TRUNCATE no pasa por RLS). Después se da solo lo que hace falta:
--   * anon (sin sesión): nada.
--   * authenticated (el dueño con sesión): leer las 7 tablas; crear y editar en las 5 suyas;
--     item_events y area_counters solo se leen (R4: las llenan disparadores security definer).
--     Nunca borrar ni vaciar: "sin borrado" vale también a nivel de privilegios.
--   * service_role (el enchufe de la fase 2, que salta RLS): todo, tablas y secuencias.
revoke all on
  public.areas, public.sources, public.items, public.item_links,
  public.item_events, public.suggestions, public.area_counters
from anon, authenticated;
revoke all on sequence public.item_events_id_seq from anon, authenticated;

grant select, insert, update on
  public.areas, public.sources, public.items, public.item_links, public.suggestions
to authenticated;

grant select on public.item_events, public.area_counters to authenticated;

grant all on
  public.areas, public.sources, public.items, public.item_links,
  public.item_events, public.suggestions, public.area_counters
to service_role;
grant all on sequence public.item_events_id_seq to service_role;
