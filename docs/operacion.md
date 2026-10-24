# Operación de Cerebro

Cómo se corre, se publica y se cuida. Sin llaves ni contraseñas: esas viven en el panel de Supabase, en los secretos de GitHub y en tu cabeza.

## Dónde vive

- Código: `D:\1.-Pixely\7.-Cerebro` en la computadora, y en GitHub en `lam218313-beep/gasparina` (privado), rama `main` directa.

## El proyecto real

- Supabase, proyecto **cerebro**, referencia `zcjufyrloyoewkezqucx`, región `us-east-1`, plan gratis (USD 0). URL: `https://zcjufyrloyoewkezqucx.supabase.co`.
- Creado el 22 oct 2026. Para hacerle espacio se pausó el proyecto `quanta` (`nuuqkwdopdsgokiziyum`): el plan gratis permite 2 proyectos activos y el otro es Pixely Partners.
- Un solo usuario: se crea a mano en el panel (Authentication → Users → Add user, correo y contraseña). El registro abierto va apagado: Authentication → Sign In / Providers → Email → "Allow new users to sign up" desactivado.
- La app usa la llave **publishable** (`sb_publishable_…`) en el `.env` local (ignorado por git). La llave secreta y la `service_role` nunca entran en la app ni en el repositorio.
- Plan gratis: si pasa una semana sin actividad, Supabase pausa el proyecto; se reanuda desde el panel. No trae copias de seguridad: por eso el respaldo semanal de abajo.

## Correr en la computadora

```bash
supabase start          # el Supabase local (Docker)
npm run dev             # la app en el navegador, con el .env local (apunta al proyecto real)
```

Pruebas: `supabase db reset && npm run test:db` (base), `npm run test:unit` (unitarias), `npm run test:e2e` (la app contra el Supabase local; usa `.env.e2e`, que se escribe con los valores de `supabase status -o env`).

## Publicar cambios de la base (migraciones)

Las migraciones viven en `supabase/migrations/` y el historial remoto está alineado con sus nombres (`20261022000001_cerebro`, `…02_triggers`, `…03_lectura`).

- **Por el CLI (lo normal):** una vez, `supabase login` (abre el navegador) y `supabase link --project-ref zcjufyrloyoewkezqucx` (pide la contraseña de la base: Settings → Database → Reset database password si no la tienes). Después, cada vez: `supabase db push`.
- **Por el conector de Supabase de Claude** (así se publicaron las tres primeras el 22 oct 2026, porque el CLI tenía la sesión vencida): se aplica cada archivo con `apply_migration` usando el mismo nombre del archivo, y después se alinea la versión en `supabase_migrations.schema_migrations` con la del archivo. Si el CLI se queja del historial: `supabase migration repair --status applied <versión>`.
- `supabase/config.toml` tiene `auto_expose_new_tables = false`, que el CLI retira el 30 oct 2026. Al actualizar el CLI (la fase 2 necesita ≥ 2.117) borra esa línea: los permisos ya se dan explícitos en cada migración.

## Respaldo semanal

`.github/workflows/respaldo-base.yml` hace un volcado cada lunes y lo guarda 90 días como artefacto privado del repositorio. Necesita el secreto `SUPABASE_DB_URL` en GitHub → Settings → Secrets and variables → Actions: la cadena "Session pooler" del panel (Connect → Session pooler), con la contraseña de la base puesta. Para restaurar: `pg_restore --no-owner --dbname "<cadena>" cerebro-AAAA-MM-DD.dump`.

## La APK

La llave de firma (`cerebro.jks`) vive en `D:\1.-Pixely\_respaldos\cerebro-firma\` y en una copia en Drive; nunca en el repositorio. Sin ella no se puede actualizar la app ya instalada. `android/keystore.properties` (ignorado) apunta a esa llave. Cómo se construye e instala: `docs/superpowers/plans/2026-10-22-fase-1-cerebro.md`, tarea 12.
