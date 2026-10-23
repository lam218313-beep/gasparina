-- Cerebro, fase 1: funciones de lectura.
--
--   * effective_importance: la importancia propia o la heredada del antepasado más cercano.
--   * item_path: "Pixely › Proyecto X" (área efectiva y antepasados, sin el propio ítem).
--   * project_progress: cuántas tareas descendientes hay y cuántas están hechas.
--   * v_items: items más los campos efectivos, para que la app no calcule herencia.
--   * today_items: lo que va en la pantalla Hoy (foco, noche, agenda, vence), en hora de Lima.
--
-- Todas trabajan con los permisos de quien las llama (security invoker): RLS aplica igual que en
-- las tablas. item_ancestors y effective_area vienen de la migración anterior.

-- ---------------------------------------------------------------------------
-- effective_importance
-- ---------------------------------------------------------------------------
create function public.effective_importance(p_item uuid)
returns smallint
language sql
stable
as $$
  select coalesce(
    (select i.importance from public.items i where i.id = p_item),
    (select i.importance
       from public.item_ancestors(p_item) a
       join public.items i on i.id = a.id
      where i.importance is not null
      order by a.depth
      limit 1)
  );
$$;

-- ---------------------------------------------------------------------------
-- item_path: nombre del área efectiva › antepasados de la raíz al padre
-- ---------------------------------------------------------------------------
-- concat_ws salta los nulos: sin área sale solo la cadena de antepasados, y al revés.
create function public.item_path(p_item uuid)
returns text
language sql
stable
as $$
  select concat_ws(
    ' › ',
    (select a.name from public.areas a where a.id = public.effective_area(p_item)),
    (select string_agg(i.title, ' › ' order by anc.depth desc)
       from public.item_ancestors(p_item) anc
       join public.items i on i.id = anc.id)
  );
$$;

-- ---------------------------------------------------------------------------
-- project_progress: tareas descendientes hechas / totales
-- ---------------------------------------------------------------------------
-- Tope de 50 niveles por seguridad (la guardia de ciclos ya impide bucles).
create function public.project_progress(p_item uuid)
returns table (done int, total int)
language sql
stable
as $$
  with recursive bajada (id, kind, status, depth) as (
    select i.id, i.kind, i.status, 1
    from public.items i
    where i.parent_id = p_item
    union all
    select i.id, i.kind, i.status, b.depth + 1
    from public.items i
    join bajada b on i.parent_id = b.id
    where b.depth < 50
  )
  select
    count(*) filter (where b.status = 'hecho')::int as done,
    count(*)::int as total
  from bajada b
  where b.kind = 'tarea';
$$;

-- ---------------------------------------------------------------------------
-- v_items: items con sus campos efectivos
-- ---------------------------------------------------------------------------
create view public.v_items
with (security_invoker = on)
as
select
  i.*,
  ea.area_id                        as effective_area_id,
  public.effective_importance(i.id) as effective_importance,
  public.item_path(i.id)            as path,
  a.slug                            as area_slug,
  a.color                           as area_color
from public.items i
left join lateral (select public.effective_area(i.id) as area_id) ea on true
left join public.areas a on a.id = ea.area_id;

-- ---------------------------------------------------------------------------
-- today_items: la pantalla Hoy
-- ---------------------------------------------------------------------------
-- Buckets, en este orden y sin repetir ítem:
--   foco   = focus_on = p_day, como máximo 3, por importancia efectiva.
--   noche  = evening y (ocurre en p_day o focus_on = p_day).
--   agenda = ocurre en p_day y no es de noche.
--   vence  = due_at cae en p_day.
-- "Cae en p_day" se mide en hora de Lima. "Ocurre en p_day": start_at cae en p_day, o el evento es
-- semanal, empezó ese día o antes, y cae en el mismo día de la semana; entonces sort_at es p_day con
-- la hora de start_at. Fuera quedan hecho y descartado.
create function public.today_items(p_day date)
returns table (item_id uuid, bucket text, sort_at timestamptz)
language sql
stable
as $$
  with base as (
    select i.*, public.effective_importance(i.id) as eff_imp
    from public.items i
    where i.status not in ('hecho', 'descartado')
  ),
  ocurre as (
    select
      b.id,
      case
        when b.repeat_rule = 'semanal'
         and (b.start_at at time zone 'America/Lima')::date <= p_day
         and extract(dow from (b.start_at at time zone 'America/Lima')) = extract(dow from p_day)
          then (p_day + (b.start_at at time zone 'America/Lima')::time) at time zone 'America/Lima'
        when (b.start_at at time zone 'America/Lima')::date = p_day
          then b.start_at
      end as sort_at
    from base b
    where b.start_at is not null
  ),
  foco as (
    select b.id, 'foco'::text as bucket,
           coalesce(b.start_at, b.due_at, b.created_at) as sort_at,
           row_number() over (order by b.eff_imp desc nulls last, b.created_at) as ord
    from base b
    where b.focus_on = p_day
  ),
  todo (id, bucket, sort_at, ord, pri) as (
    select id, bucket, sort_at, ord, 1 from foco where ord <= 3
    union all
    select b.id, 'noche', coalesce(o.sort_at, b.start_at, b.created_at), 0, 2
    from base b
    left join ocurre o on o.id = b.id
    where b.evening and (o.sort_at is not null or b.focus_on = p_day)
    union all
    select o.id, 'agenda', o.sort_at, 0, 3
    from ocurre o
    join base b on b.id = o.id
    where o.sort_at is not null and not b.evening
    union all
    select b.id, 'vence', b.due_at, 0, 4
    from base b
    where (b.due_at at time zone 'America/Lima')::date = p_day
  ),
  unico as (
    select distinct on (id) id, bucket, sort_at, ord, pri
    from todo
    order by id, pri, ord
  )
  select id, bucket, sort_at
  from unico
  order by pri, ord, sort_at;
$$;

-- ---------------------------------------------------------------------------
-- Privilegios: lo nuevo también se da explícito (ver migración 0001)
-- ---------------------------------------------------------------------------
grant select on public.v_items to authenticated, service_role;
grant execute on function
  public.effective_importance(uuid), public.item_path(uuid),
  public.project_progress(uuid), public.today_items(date)
to authenticated, service_role;
