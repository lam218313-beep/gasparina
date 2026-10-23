-- Prueba de las funciones de lectura: importancia heredada, ruta, progreso del proyecto, la vista
-- v_items y la vista de hoy (today_items) en hora de Lima.
--
-- Se actúa como el usuario semilla ya conectado (rol authenticated), igual que en 02_triggers.sql.
begin;
select plan(8);

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

-- Árbol de prueba: Proyecto X (área Pixely, importancia 4) con tres tareas sin área propia.
insert into items (title, kind, area_id, importance, status)
values ('Proyecto X', 'proyecto', (select id from areas where prefix = 'PIX'), 4, 'en_curso');
insert into items (title, parent_id, status)
values ('Tarea A', (select id from items where title = 'Proyecto X'), 'siguiente');
insert into items (title, parent_id, importance, status)
values ('Tarea B', (select id from items where title = 'Proyecto X'), 2, 'siguiente');
insert into items (title, parent_id, status)
values ('Tarea C', (select id from items where title = 'Proyecto X'), 'siguiente');
update items set status = 'hecho' where title = 'Tarea C';

-- (a) La tarea sin área hereda el área del proyecto.
select is(
  (select effective_area(id) from items where title = 'Tarea A'),
  (select id from areas where prefix = 'PIX'),
  'la tarea sin área hereda Pixely de su proyecto'
);

-- (b) La importancia se hereda solo cuando falta la propia.
select is(
  array[
    (select effective_importance(id) from items where title = 'Tarea A'),
    (select effective_importance(id) from items where title = 'Tarea B')
  ],
  array[4::smallint, 2::smallint],
  'la importancia hereda 4 del proyecto y respeta el 2 propio'
);

-- (c) La ruta: nombre del área efectiva y los títulos de los ancestros, sin el propio ítem.
select is(
  (select item_path(id) from items where title = 'Tarea A'),
  'Pixely › Proyecto X',
  'la ruta de la tarea es Pixely › Proyecto X'
);

-- (d) El progreso del proyecto cuenta tareas descendientes y cuántas están hechas.
select is(
  (select array[done, total] from project_progress((select id from items where title = 'Proyecto X'))),
  array[1, 3],
  'el proyecto va 1 de 3'
);

-- (e) "Vence hoy" se decide en hora de Lima: las 23:30 del 22 (04:30 UTC del 23) vence el 22;
-- las 23:30 del 21 (04:30 UTC del 22) no.
insert into items (title, due_at) values ('Vence tarde', '2026-10-23 04:30+00');
insert into items (title, due_at) values ('Vence ayer', '2026-10-22 04:30+00');
select is(
  array(
    select i.title from today_items('2026-10-22') t join items i on i.id = t.item_id
    where t.bucket = 'vence' order by i.title
  ),
  array['Vence tarde'],
  'vence hoy respeta la medianoche de Lima'
);

-- (f) Como máximo 3 en foco, los de mayor importancia, en ese orden.
insert into items (title, importance, focus_on) values
  ('F2', 2, '2026-10-22'), ('F5', 5, '2026-10-22'), ('F3', 3, '2026-10-22'), ('F4', 4, '2026-10-22');
select is(
  array(
    select i.title from today_items('2026-10-22') t join items i on i.id = t.item_id
    where t.bucket = 'foco'
  ),
  array['F5', 'F4', 'F3'],
  'foco devuelve solo los 3 más importantes, ordenados'
);

-- (g) Un ítem en foco que además vence hoy aparece una sola vez (en foco).
update items set due_at = '2026-10-22 20:00+00' where title = 'F5';
select is(
  array(
    select t.bucket from today_items('2026-10-22') t join items i on i.id = t.item_id
    where i.title = 'F5'
  ),
  array['foco'],
  'un ítem en foco que vence hoy aparece una sola vez'
);

-- (h) Un evento semanal del jueves 15 a las 08:00 de Lima aparece el jueves 22 en agenda, con la
-- hora de ese día, y no aparece el viernes 23.
insert into items (title, kind, start_at, duration_min, repeat_rule)
values ('Clase', 'evento', '2026-10-15 13:00+00', 90, 'semanal');
select is(
  array[
    (select string_agg(i.title || '@' || t.sort_at::text, ',')
       from today_items('2026-10-22') t join items i on i.id = t.item_id
      where t.bucket = 'agenda'),
    (select count(*)::text from today_items('2026-10-23') t join items i on i.id = t.item_id
      where i.title = 'Clase')
  ],
  array['Clase@2026-10-22 13:00:00+00', '0'],
  'el evento semanal aparece el jueves 22 en agenda y no el viernes 23'
);

select * from finish();
rollback;
