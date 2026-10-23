import { test, expect, type Page } from './fixtures';

// Las pruebas de este archivo van en orden y comparten un usuario nuevo (ver fixtures.ts).

const DIA = 24 * 60 * 60 * 1000;
/** `YYYY-MM-DD` en Lima de hace `dias` días (Lima es siempre UTC-5). */
function diaLima(dias: number): string {
  return new Date(Date.now() - dias * DIA - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

interface Captura { titulo: string; area?: string; evento?: { hora: string; dia?: string; duracion?: number; semanal?: boolean }; noche?: boolean; vence?: string }

async function capturar(page: Page, c: Captura) {
  await page.getByRole('button', { name: 'Capturar' }).click();
  const hoja = page.getByRole('dialog', { name: 'Capturar' });
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill(c.titulo);
  if (c.area) await hoja.getByRole('button', { name: c.area }).click();
  if (c.evento) {
    await hoja.getByLabel('Es un evento').check();
    if (c.evento.dia) await hoja.getByLabel('Fecha', { exact: true }).fill(c.evento.dia);
    await hoja.getByLabel('Hora').fill(c.evento.hora);
    if (c.evento.duracion) await hoja.getByLabel('Duración (min)').fill(String(c.evento.duracion));
    if (c.evento.semanal) await hoja.getByLabel('Cada semana').check();
  }
  if (c.vence) await hoja.getByLabel('Fecha límite').fill(c.vence);
  if (c.noche) await hoja.getByLabel('Esta noche').check();
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
}

test('con la base limpia, Hoy es un día libre', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hoy.' })).toBeVisible();
  await expect(page.getByText('Día libre')).toBeVisible();
});

test('la agenda muestra los eventos de hoy en orden de hora', async ({ page }) => {
  await page.goto('/');
  await capturar(page, { titulo: 'Tarde', area: 'Pixely', evento: { hora: '15:00', duracion: 30 } });
  await capturar(page, { titulo: 'Temprano', area: 'Pixely', evento: { hora: '09:00' } });
  await page.goto('/');
  const agenda = page.getByRole('list', { name: 'Agenda' }).getByRole('listitem');
  await expect(agenda).toHaveText([/09:00[\s\S]*Temprano/, /15:00[\s\S]*Tarde/]);
  await expect(agenda.nth(1)).toContainText('30 min');
});

test('se eligen hasta tres cosas para ahora', async ({ page }) => {
  await page.goto('/');
  for (const t of ['Uno', 'Dos', 'Tres', 'Cuatro']) await capturar(page, { titulo: t, area: 'Universidad' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Elegir' }).click();
  const hoja = page.getByRole('dialog', { name: 'Para ahora' });
  for (const t of ['Uno', 'Dos', 'Tres']) await hoja.getByRole('button', { name: t }).click();
  await hoja.getByRole('button', { name: 'Cuatro' }).click();
  await expect(hoja.getByText('Ya tienes 3 para ahora')).toBeVisible();
  await hoja.getByRole('button', { name: 'Listo' }).click();
  await expect(page.getByRole('list', { name: 'Para ahora' }).getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Elegir' })).toHaveCount(0);
});

test('Hecho saca la tarjeta de Para ahora y el ítem queda hecho en el mapa', async ({ page }) => {
  await page.goto('/');
  const foco = page.getByRole('list', { name: 'Para ahora' });
  await foco.getByRole('article', { name: 'Uno' }).getByRole('button', { name: 'Hecho' }).click();
  await expect(foco.getByRole('article')).toHaveCount(2);
  await page.goto('/mapa/area/universidad');
  await expect(page.getByRole('listitem').filter({ hasText: 'Uno' })).toContainText('Hecho');
});

test('un evento de esta noche va en Esta noche, no en la agenda', async ({ page }) => {
  await page.goto('/');
  await capturar(page, { titulo: 'Cena', area: 'Personal', evento: { hora: '20:00' }, noche: true });
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Esta noche' })).toContainText('Cena');
  await expect(page.getByRole('list', { name: 'Agenda' })).not.toContainText('Cena');
});

test('una tarea que vence hoy aparece con Vence hoy', async ({ page }) => {
  await page.goto('/');
  await capturar(page, { titulo: 'Pagar la luz', area: 'Personal', vence: diaLima(0) });
  await page.goto('/');
  const fila = page.getByRole('list', { name: 'Agenda' }).getByRole('listitem').filter({ hasText: 'Pagar la luz' });
  await expect(fila).toContainText('Vence hoy');
});

test('un evento semanal aparece cada semana el mismo día', async ({ page }) => {
  await page.goto('/');
  // Empezó hace 7 días (mismo día de la semana): hoy toca. Empezó hace 8: hoy no.
  await capturar(page, { titulo: 'Clase', area: 'Universidad', evento: { hora: '08:00', dia: diaLima(7), semanal: true } });
  await capturar(page, { titulo: 'Taller', area: 'Universidad', evento: { hora: '08:00', dia: diaLima(8), semanal: true } });
  await page.goto('/');
  const agenda = page.getByRole('list', { name: 'Agenda' });
  await expect(agenda).toContainText('Clase');
  await expect(agenda).not.toContainText('Taller');
});
