-- Prueba de la base: las tablas del cerebro existen, la seguridad por fila (RLS)
-- deja a cada dueño ver y crear solo lo suyo, nadie puede borrar, y la base
-- rechaza un título en blanco o una importancia fuera de 1 a 5.
begin;
select plan(6);

-- (a) Existen las tablas del cerebro (si falta alguna, la prueba dice cuál).
select is(
  array(
    select t
    from unnest(array[
      'areas', 'sources', 'items', 'item_links',
      'item_events', 'suggestions', 'area_counters'
    ]) as t
    where to_regclass('public.' || t) is null
    order by t
  ),
  array[]::text[],
  'existen las tablas del cerebro'
);

-- Quién es el usuario semilla: se lee como administrador, antes de cambiar de rol.
select set_config(
  'test.dueno',
  (select id::text from auth.users where email = 'prueba@cerebro.local'),
  true
);

-- A partir de aquí se actúa como el usuario semilla ya conectado (rol authenticated).
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.dueno'), 'role', 'authenticated')::text,
  true
);

-- (b) El dueño puede crear un ítem y lo ve.
insert into items (title) values ('Probar');
select is(
  (select count(*) from items where title = 'Probar'),
  1::bigint,
  'el dueño crea un ítem y lo ve'
);

-- (c) Otro usuario (un sub cualquiera) no ve nada, aunque el ítem ya exista.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text,
  true
);
select is(
  (select count(*) from items),
  0::bigint,
  'otro usuario ve 0 ítems'
);

-- (d) Vuelve el dueño: borrar está prohibido a nivel de privilegios (la base lo
-- rechaza con 42501; no depende de que RLS filtre filas).
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.dueno'), 'role', 'authenticated')::text,
  true
);
select throws_ok(
  $$delete from items$$,
  '42501',
  'permission denied for table items',
  'borrar es un error de permiso aun siendo el dueño'
);

-- (e) Un título de solo espacios lo rechaza la base.
select throws_like(
  $$insert into items (title) values ('   ')$$,
  '%violates check constraint "items_title_not_blank"%',
  'un título de solo espacios viola la restricción'
);

-- (f) Una importancia fuera de 1 a 5 la rechaza la base.
select throws_like(
  $$insert into items (title, importance) values ('Con importancia', 7)$$,
  '%violates check constraint "items_importance_range"%',
  'una importancia de 7 viola la restricción'
);

select * from finish();
rollback;
