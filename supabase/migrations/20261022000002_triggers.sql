-- Cerebro, fase 1: disparadores de items.
--
--   * item_ancestors / effective_area: leen el árbol de padres. Se definen aquí porque el código
--     corto necesita el área efectiva (la tarea siguiente las usa en la vista, no las vuelve a crear).
--   * guard_item_parent: nadie puede ser su propio antepasado, ni colgar de más de 20 niveles.
--   * assign_short_id: PIX-1, PIX-2, ... por área (la propia o la heredada del padre).
--   * touch_item: sello de edición (updated_at, version) y cierre (done_at).
--   * log_item_change: el historial automático en item_events.
--
-- Orden de los disparadores BEFORE: Postgres corre los del mismo momento por el orden
-- alfabético de su nombre, por eso llevan el número en el nombre: primero la guardia (si el padre
-- no vale, no se gasta un número del contador), luego el código corto, luego el sello.

-- ---------------------------------------------------------------------------
-- item_ancestors: los antepasados de un ítem (depth 1 = su padre, 2 = su abuelo, ...)
-- ---------------------------------------------------------------------------
-- Tope de seguridad de 50 niveles: guard_item_parent impide los ciclos, pero si algún día uno se
-- colara (dos cambios simultáneos, una carga directa), la consulta termina en vez de dar vueltas
-- para siempre.
create function public.item_ancestors(p_item uuid)
returns table (id uuid, depth int)
language sql
stable
as $$
  with recursive subida (id, depth) as (
    select i.parent_id, 1
    from public.items i
    where i.id = p_item and i.parent_id is not null
    union all
    select i.parent_id, s.depth + 1
    from subida s
    join public.items i on i.id = s.id
    where i.parent_id is not null and s.depth < 50
  )
  select s.id, s.depth from subida s;
$$;

-- ---------------------------------------------------------------------------
-- effective_area: el área del ítem, o la del antepasado más cercano que tenga una
-- ---------------------------------------------------------------------------
create function public.effective_area(p_item uuid)
returns uuid
language sql
stable
as $$
  select coalesce(
    (select i.area_id from public.items i where i.id = p_item),
    (select i.area_id
       from public.item_ancestors(p_item) a
       join public.items i on i.id = a.id
      where i.area_id is not null
      order by a.depth
      limit 1)
  );
$$;

-- ---------------------------------------------------------------------------
-- guard_item_parent: sin ciclos y sin más de 20 niveles
-- ---------------------------------------------------------------------------
create function public.guard_item_parent()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  -- Un update que no mueve al ítem (parent_id igual) no necesita revisión.
  if tg_op = 'UPDATE' and new.parent_id is not distinct from old.parent_id then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'ciclo';
  end if;
  if exists (
    select 1 from public.item_ancestors(new.parent_id) a where a.id = new.id
  ) then
    raise exception 'ciclo';
  end if;
  if exists (
    select 1 from public.item_ancestors(new.parent_id) a where a.depth > 20
  ) then
    raise exception 'demasiada profundidad';
  end if;

  return new;
end;
$$;

create trigger items_1_guard_parent
  before insert or update of parent_id on public.items
  for each row execute function public.guard_item_parent();

-- ---------------------------------------------------------------------------
-- assign_short_id: el código corto (PIX-1, UNI-3, ...)
-- ---------------------------------------------------------------------------
-- security definer (R4): el dueño no puede escribir en area_counters (no hay política de
-- escritura), así que el contador lo mueve esta función con los permisos de quien la creó.
-- Por eso mismo solo usa áreas del dueño del ítem: una función que salta RLS no debe leer ni
-- gastar números de un área ajena.
-- Una vez puesto, el código no cambia aunque el ítem cambie de área.
create function public.assign_short_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_area   uuid;
  v_prefix text;
  v_seq    integer;
begin
  if new.short_id is not null then
    return new;
  end if;

  -- El área efectiva: la propia o, si no tiene, la del padre o la del antepasado más cercano.
  v_area := coalesce(new.area_id, public.effective_area(new.parent_id));
  if v_area is null then
    return new;
  end if;

  select a.prefix into v_prefix
  from public.areas a
  where a.id = v_area and a.owner_id = new.owner_id;
  if v_prefix is null then
    return new;
  end if;

  insert into public.area_counters (area_id) values (v_area) on conflict do nothing;

  -- for update: dos altas simultáneas en la misma área hacen cola y no repiten el número.
  select c.last_seq + 1 into v_seq
  from public.area_counters c
  where c.area_id = v_area
  for update;

  update public.area_counters set last_seq = v_seq where area_id = v_area;

  new.short_id := v_prefix || '-' || v_seq;
  new.seq := v_seq;
  return new;
end;
$$;

create trigger items_2_assign_short_id
  before insert or update of area_id, parent_id on public.items
  for each row execute function public.assign_short_id();

-- ---------------------------------------------------------------------------
-- touch_item: sello de edición y cierre
-- ---------------------------------------------------------------------------
-- version sube de uno en uno en cada update: la app la usa para no pisar cambios ajenos
-- (update ... where version = la que leyó). Quien llama no puede fijarla.
create function public.touch_item()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.version := old.version + 1;

  if new.status = 'hecho' then
    if new.done_at is null then
      new.done_at := now();
    end if;
  elsif old.status = 'hecho' then
    new.done_at := null;
  end if;

  return new;
end;
$$;

create trigger items_3_touch
  before update on public.items
  for each row execute function public.touch_item();

-- ---------------------------------------------------------------------------
-- log_item_change: el historial automático
-- ---------------------------------------------------------------------------
-- security definer (R4): item_events no tiene política de escritura para el dueño; solo esta
-- función la llena. Corre AFTER, así que ve la fila ya terminada (con su código y su version).
-- Quién hizo el cambio sale de la variable de sesión cerebro.actor (la fija el enchufe de Claude
-- o la automatización); sin ella, es el dueño ('user'). nullif: si la variable existe pero quedó
-- vacía, current_setting devuelve '' y no NULL, y '' no pasaría la check de item_events.actor.
create function public.log_item_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := coalesce(nullif(current_setting('cerebro.actor', true), ''), 'user');
begin
  if tg_op = 'INSERT' then
    insert into public.item_events (owner_id, item_id, actor, field, after)
    values (new.owner_id, new.id, v_actor, 'creado', to_jsonb(new));
    return null;
  end if;

  insert into public.item_events (owner_id, item_id, actor, field, before, after)
  select new.owner_id, new.id, v_actor, c.field, c.antes, c.despues
  from (
    values
      ('status',     to_jsonb(old.status),     to_jsonb(new.status)),
      ('importance', to_jsonb(old.importance), to_jsonb(new.importance)),
      ('parent_id',  to_jsonb(old.parent_id),  to_jsonb(new.parent_id)),
      ('area_id',    to_jsonb(old.area_id),    to_jsonb(new.area_id)),
      ('title',      to_jsonb(old.title),      to_jsonb(new.title)),
      ('due_at',     to_jsonb(old.due_at),     to_jsonb(new.due_at)),
      ('start_at',   to_jsonb(old.start_at),   to_jsonb(new.start_at)),
      ('focus_on',   to_jsonb(old.focus_on),   to_jsonb(new.focus_on)),
      ('kind',       to_jsonb(old.kind),       to_jsonb(new.kind))
  ) as c (field, antes, despues)
  where c.antes is distinct from c.despues;

  return null;
end;
$$;

create trigger items_4_log_change
  after insert or update on public.items
  for each row execute function public.log_item_change();

-- ---------------------------------------------------------------------------
-- Quién puede llamar a las funciones security definer
-- ---------------------------------------------------------------------------
-- Las dos saltan RLS, así que nadie debe poder llamarlas a mano (por defecto Postgres da EXECUTE a
-- todos, y la nube también a anon y authenticated). Los disparadores no necesitan ese permiso para
-- correr: lo cumple Postgres al disparar, no quien hace el insert. Las otras cuatro funciones
-- trabajan con los permisos de quien las llama (RLS aplica) y no necesitan este cuidado.
revoke execute on function public.assign_short_id(), public.log_item_change()
  from public, anon, authenticated;

-- Las dos funciones de lectura las usan la vista v_items y la guardia de ciclos con los permisos de
-- quien llama: EXECUTE explícito, para no depender del EXECUTE por defecto de PUBLIC (que la nube
-- puede retirar al endurecer el proyecto).
grant execute on function public.item_ancestors(uuid), public.effective_area(uuid)
  to authenticated, service_role;
