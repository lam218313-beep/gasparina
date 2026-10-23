-- Las funciones de lectura que usan la vista y los disparadores (item_ancestors, effective_area)
-- deben tener EXECUTE explícito para authenticated: en la nube, Supabase recomienda quitar el
-- EXECUTE por defecto de PUBLIC, y sin el grant explícito v_items y cualquier insert con padre
-- fallarían con "permission denied for function".
begin;
select plan(2);

-- Simula el endurecimiento de la nube dentro de la transacción (se deshace con el rollback).
revoke execute on function public.item_ancestors(uuid), public.effective_area(uuid) from public;

select ok(
  has_function_privilege('authenticated', 'public.item_ancestors(uuid)', 'execute'),
  'authenticated conserva EXECUTE en item_ancestors aunque PUBLIC lo pierda'
);
select ok(
  has_function_privilege('authenticated', 'public.effective_area(uuid)', 'execute'),
  'authenticated conserva EXECUTE en effective_area aunque PUBLIC lo pierda'
);

select * from finish();
rollback;
