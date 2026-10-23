/**
 * Cada prueba recibe: una sesión iniciada (salvo que diga `signedIn: false`) y un guardia que la
 * hace fallar si la app lanza un error, escribe un console.error o muestra "Algo salió mal".
 *
 * Aislamiento: cada archivo de prueba trabaja con un usuario NUEVO del Supabase local, creado con
 * la API de administración (llave service_role local, leída de .env.e2e). Así cada archivo parte de
 * una base limpia. Las pruebas de un archivo corren en orden (fullyParallel: false) y comparten
 * ese usuario. entrar.spec.ts usa `signedIn: false` y el usuario semilla.
 */
import { test as base, expect, type Browser, type BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

function readEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync('.env.e2e', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}
const env = readEnv();
export const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

/** El usuario de la semilla local (supabase/seed.sql). Solo existe en la base local. */
export const SEED = { email: 'prueba@cerebro.local', password: 'cerebro-local-1234' };

interface FileUser { email: string; password: string; state: StorageState }

// Un usuario por archivo de prueba, dentro de este proceso (worker).
const usersByFile = new Map<string, Promise<FileUser>>();

async function createFileUser(browser: Browser, baseURL: string, file: string, worker: number): Promise<FileUser> {
  const slug = basename(file).replace(/\.spec\.ts$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const email = `e2e-${slug}-${worker}-${Date.now().toString(36)}@cerebro.local`;
  const password = `e2e-${randomUUID()}`;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No se pudo crear el usuario de prueba ${email}: ${error.message}`);

  // Entra una vez por la pantalla Entrar y guarda la sesión para todas las pruebas del archivo.
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hoy.' })).toBeVisible({ timeout: 15_000 });
  const state = await context.storageState();
  await context.close();
  return { email, password, state };
}

export function userForFile(browser: Browser, baseURL: string, file: string, worker: number): Promise<FileUser> {
  let p = usersByFile.get(file);
  if (!p) { p = createFileUser(browser, baseURL, file, worker); usersByFile.set(file, p); }
  return p;
}

interface Options { signedIn: boolean }

export const test = base.extend<Options>({
  signedIn: [true, { option: true }],

  storageState: async ({ browser, baseURL, signedIn }, use, testInfo) => {
    if (!signedIn) { await use(undefined); return; }
    const user = await userForFile(browser, baseURL!, testInfo.file, testInfo.workerIndex);
    await use(user.state);
  },

  page: async ({ page }, use) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`Error de la app: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !expectedConsole(m.text())) problems.push(`console.error: ${m.text()}`); });

    await use(page);

    const broken = await page.getByText('Algo salió mal').count().catch(() => 0);
    if (broken) problems.push('Se mostró la pantalla "Algo salió mal"');
    expect(problems, 'La app no debe romperse').toEqual([]);
  },
});

/** Errores que el navegador registra a propósito en algunas pruebas (una petición que el servidor rechaza). */
const expectedConsole = (t: string) => /Failed to load resource: (the server responded with a status of [45]\d\d|net::ERR_INTERNET_DISCONNECTED)/.test(t);

export { expect };
