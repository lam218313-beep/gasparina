-- Prueba de privilegios (GRANT) de las tablas del cerebro. Es la segunda capa de seguridad,
-- debajo de RLS: RLS decide qué filas ve cada dueño; los privilegios deciden qué operaciones
-- existen. Aquí se fija que el local reparte lo mismo que la nube (config.toml trae
-- auto_expose_new_tables = false) y que "sin borrado" vale también para TRUNCATE, que no pasa
-- por RLS.
begin;
select plan(8);

create temp table cerebro_tablas (t text primary key);
insert into cerebro_tablas (t) values
  ('areas'), ('sources'), ('items'), ('item_links'),
  ('item_events'), ('suggestions'), ('area_counters');

-- (a) El visitante sin sesión (anon) no tiene ningún privilegio sobre ninguna tabla.
select is(
  array(
    select c.t from cerebro_tablas c
    where has_table_privilege(
      'anon', 'public.' || c.t, 'select,insert,update,delete,truncate,references,trigger'
    )
    order by c.t
  ),
  array[]::text[],
  'anon no tiene ningún privilegio sobre las tablas del cerebro'
);

-- (b) Quien tiene sesión (authenticated) lee las 7 tablas.
select is(
  array(
    select c.t from cerebro_tablas c
    where not has_table_privilege('authenticated', 'public.' || c.t, 'select')
    order by c.t
  ),
  array[]::text[],
  'authenticated puede leer las 7 tablas'
);

-- (c) authenticated crea y edita en las 5 tablas del dueño.
select is(
  array(
    select c.t from cerebro_tablas c
    where c.t in ('areas', 'sources', 'items', 'item_links', 'suggestions')
      and not (
        has_table_privilege('authenticated', 'public.' || c.t, 'insert')
        and has_table_privilege('authenticated', 'public.' || c.t, 'update')
      )
    order by c.t
  ),
  array[]::text[],
  'authenticated puede crear y editar areas, sources, items, item_links y suggestions'
);

-- (d) item_events y area_counters son solo de lectura para authenticated (R4: las llenan
-- disparadores security definer).
select is(
  array(
    select c.t from cerebro_tablas c
    where c.t in ('item_events', 'area_counters')
      and has_table_privilege('authenticated', 'public.' || c.t, 'insert,update')
    order by c.t
  ),
  array[]::text[],
  'authenticated no escribe en item_events ni en area_counters'
);

-- (e) Nada se borra: ni DELETE, ni TRUNCATE (que no pasa por RLS), ni los privilegios
-- sobrantes que el Postgres de Supabase reparte aunque auto_expose_new_tables sea false.
select is(
  array(
    select c.t from cerebro_tablas c
    where has_table_privilege('authenticated', 'public.' || c.t, 'delete,truncate,references,trigger')
    order by c.t
  ),
  array[]::text[],
  'authenticated no puede borrar, vaciar ni referenciar las tablas del cerebro'
);

-- (f) El enchufe de la fase 2 entra como service_role: necesita todo sobre las 7 tablas y su secuencia.
select is(
  array(
    select c.t || ':' || p.p
    from cerebro_tablas c
    cross join (values ('select'), ('insert'), ('update'), ('delete'), ('truncate')) as p (p)
    where not has_table_privilege('service_role', 'public.' || c.t, p.p)
    order by 1
  ),
  array[]::text[],
  'service_role tiene select, insert, update, delete y truncate sobre las 7 tablas'
);
select ok(
  has_sequence_privilege('service_role', 'public.item_events_id_seq', 'usage,select,update'),
  'service_role puede usar la secuencia de item_events'
);

-- (g) Comportamiento real, no solo la lista de privilegios: vaciar la tabla lo rechaza la
-- base con 42501 aun siendo el dueño.
select set_config(
  'test.dueno',
  (select id::text from auth.users where email = 'prueba@cerebro.local'),
  true
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.dueno'), 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$truncate public.items$$,
  '42501',
  'permission denied for table items',
  'vaciar la tabla es un error de permiso aun siendo el dueño'
);
reset role;

select * from finish();
rollback;
