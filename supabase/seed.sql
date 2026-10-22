-- Datos de semilla del Supabase LOCAL (se cargan con `supabase db reset`).
--
-- El usuario de prueba y su contraseña solo existen en la base local de Docker:
-- no se usan en ningún proyecto real de Supabase. El usuario de verdad de Cerebro
-- se crea a mano en el panel de Supabase, nunca desde este archivo.

-- Usuario de prueba: prueba@cerebro.local / cerebro-local-1234
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '5eed0000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'prueba@cerebro.local',
  extensions.crypt('cerebro-local-1234', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '', '', '', ''
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '5eed0000-0000-4000-8000-000000000001',
  '5eed0000-0000-4000-8000-000000000001',
  '{"sub": "5eed0000-0000-4000-8000-000000000001", "email": "prueba@cerebro.local", "email_verified": true, "phone_verified": false}',
  'email',
  now(),
  now(),
  now()
);

-- Las seis áreas iniciales, con el color y el prefijo del código corto de cada una
-- (los colores son los de --color-area-* en src/styles.css).
insert into public.areas (owner_id, slug, name, color, prefix) values
  ('5eed0000-0000-4000-8000-000000000001', 'pixely',              'Pixely',              '#EB0C6E', 'PIX'),
  ('5eed0000-0000-4000-8000-000000000001', 'trabajo-fijo',        'Trabajo fijo',        '#3B82F6', 'TRA'),
  ('5eed0000-0000-4000-8000-000000000001', 'trabajos-temporales', 'Trabajos temporales', '#F59E0B', 'TMP'),
  ('5eed0000-0000-4000-8000-000000000001', 'universidad',         'Universidad',         '#8B5CF6', 'UNI'),
  ('5eed0000-0000-4000-8000-000000000001', 'emprendimientos',     'Emprendimientos',     '#10B981', 'EMP'),
  ('5eed0000-0000-4000-8000-000000000001', 'personal',            'Personal',            '#EC4899', 'PER');
