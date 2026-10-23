/**
 * La única conexión con Supabase. La URL y la llave "publishable" (baja autoridad, sujeta a RLS)
 * vienen del .env de cada compilación; la llave secreta nunca entra en la app.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const key: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (ver .env.example).');
}

export const supabase = createClient<Database>(url, key);
export const SUPABASE_URL: string = url;
export const SUPABASE_PUBLISHABLE_KEY: string = key;
