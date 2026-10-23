-- Prueba de los disparadores de items: el código corto por área (la propia o la heredada del
-- padre), la guardia contra ciclos, el cierre con done_at y el historial automático.
--
-- Se actúa como el usuario semilla ya conectado (rol authenticated), que NO puede escribir en
-- item_events ni en area_counters (ver 02_privilegios.sql). Si el historial y el contador se
-- llenan, es porque los disparadores security definer (R4) escriben por él.
begin;
select plan(9);

-- Quién es el usuario semilla: se lee como administrador, antes de cambiar de rol.
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

-- (a) Un ítem con el área Pixely recibe el primer código de esa área.
insert into items (title, kind, area_id)
values ('Proyecto Pixely', 'proyecto', (select id from areas where prefix = 'PIX'));
select is(
  (select short_id from items where title = 'Proyecto Pixely'),
  'PIX-1',
  'el primer ítem del área Pixely recibe PIX-1'
);

-- (b) El segundo sigue la cuenta.
insert into items (title, area_id)
values ('Segundo de Pixely', (select id from areas where prefix = 'PIX'));
select is(
  (select short_id from items where title = 'Segundo de Pixely'),
  'PIX-2',
  'el segundo ítem del área Pixely recibe PIX-2'
);

-- (c) Sin área ni padre no hay código; al darle el área Universidad, recibe el primero de UNI
-- (cada área cuenta por su lado).
insert into items (title) values ('Sin área');
select set_config(
  'test.c_antes',
  coalesce((select short_id from items where title = 'Sin área'), '(sin código)'),
  true
);
update items set area_id = (select id from areas where prefix = 'UNI') where title = 'Sin área';
select is(
  array[current_setting('test.c_antes'), (select short_id from items where title = 'Sin área')],
  array['(sin código)', 'UNI-1'],
  'sin área ni padre no hay código; al asignar Universidad recibe UNI-1'
);

-- (c2) Sin área propia, el ítem usa el área efectiva: la de su padre, o la del ancestro más
-- cercano que tenga una (la nieta sube dos niveles hasta el proyecto Pixely).
insert into items (title, parent_id)
values ('Hija sin área', (select id from items where title = 'Proyecto Pixely'));
insert into items (title, parent_id)
values ('Nieta sin área', (select id from items where title = 'Hija sin área'));
select is(
  array[
    (select short_id from items where title = 'Hija sin área'),
    (select short_id from items where title = 'Nieta sin área')
  ],
  array['PIX-3', 'PIX-4'],
  'la hija y la nieta sin área heredan Pixely y reciben PIX-3 y PIX-4'
);

-- (d) Un ítem no puede ser su propio padre.
insert into items (title) values ('Autopadre');
select throws_ok(
  $$update items set parent_id = id where title = 'Autopadre'$$,
  'P0001',
  'ciclo',
  'un ítem no puede ser su propio padre'
);

-- (e) A es padre de B y B es padre de C; poner a C como padre de A cerraría un ciclo de tres.
insert into items (title) values ('A'), ('B'), ('C');
update items set parent_id = (select id from items where title = 'A') where title = 'B';
update items set parent_id = (select id from items where title = 'B') where title = 'C';
select throws_ok(
  $$update items set parent_id = (select id from items where title = 'C') where title = 'A'$$,
  'P0001',
  'ciclo',
  'un ciclo A, B, C se detecta aunque el antepasado esté dos niveles arriba'
);

-- (f) Pasar a hecho llena done_at; volver a siguiente lo vacía.
insert into items (title, status) values ('Para cerrar', 'siguiente');
update items set status = 'hecho' where title = 'Para cerrar';
select set_config(
  'test.f_cerrado',
  coalesce((select done_at::text from items where title = 'Para cerrar'), '(vacío)'),
  true
);
update items set status = 'siguiente' where title = 'Para cerrar';
select is(
  array[
    (current_setting('test.f_cerrado') <> '(vacío)')::text,
    (select (done_at is null)::text from items where title = 'Para cerrar')
  ],
  array['true', 'true'],
  'pasar a hecho llena done_at y volver a siguiente lo vacía'
);

-- (g) Un insert deja exactamente un evento: creado, con el ítem entero (ya con su código) en after.
insert into items (title, area_id)
values ('Con historial', (select id from areas where prefix = 'TRA'));
select is(
  array(
    select e.field || '|' || e.actor || '|' || (e.after ->> 'title') || '|' || (e.after ->> 'short_id')
    from item_events e
    join items i on i.id = e.item_id
    where i.title = 'Con historial'
    order by e.id
  ),
  array['creado|user|Con historial|TRA-1'],
  'un insert deja un solo evento creado, con el ítem completo en after'
);

-- (h) Cambiar estado e importancia en un solo update deja un evento por campo, con su antes y su
-- después (y nada más: version, updated_at y done_at no se registran).
insert into items (title, importance) values ('Con cambios', 2);
update items set status = 'en_curso', importance = 5 where title = 'Con cambios';
select is(
  array(
    select e.field || '|' || e.actor || '|' || e.before::text || '|' || e.after::text
    from item_events e
    join items i on i.id = e.item_id
    where i.title = 'Con cambios' and e.field <> 'creado'
    order by e.field
  ),
  array['importance|user|2|5', 'status|user|"bandeja"|"en_curso"'],
  'cambiar status e importance de una vez crea 2 eventos con su antes y su después'
);

select * from finish();
rollback;
