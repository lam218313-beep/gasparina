import { test, expect, type Page } from './fixtures';

// Las pruebas de este archivo van en orden y comparten un usuario nuevo (ver fixtures.ts).

async function capturar(page: Page, titulo: string, area?: string) {
  await page.getByRole('button', { name: 'Capturar' }).click();
  const hoja = page.getByRole('dialog', { name: 'Capturar' });
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill(titulo);
  if (area) await hoja.getByRole('button', { name: area }).click();
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
}

const franja = (page: Page) => page.getByText(/Sin conexión|Enviando/);

test('sin señal, lo capturado aparece al instante y queda en cola', async ({ page, context }) => {
  await page.goto('/bandeja');
  await expect(page.getByText('Nada por ordenar')).toBeVisible();
  await context.setOffline(true);
  await capturar(page, 'Uno');
  await capturar(page, 'Dos');
  await expect(page.getByRole('article', { name: 'Uno' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Dos' })).toBeVisible();
  await expect(franja(page)).toContainText('Sin conexión');
  await expect(franja(page)).toContainText('2 cambios');
});

test('al volver la señal, los cambios se envían y sobreviven a la recarga', async ({ page, context }) => {
  await page.goto('/bandeja');
  await context.setOffline(true);
  await capturar(page, 'Uno');
  await capturar(page, 'Dos');
  await expect(franja(page)).toContainText('2 cambios');
  await context.setOffline(false);
  await expect(franja(page)).toHaveCount(0, { timeout: 15_000 });
  await page.reload();
  const tarjetas = page.getByRole('list').getByRole('article');
  await expect(tarjetas).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Uno' })).toHaveCount(1);
  await expect(page.getByRole('article', { name: 'Dos' })).toHaveCount(1);
});

test('una importancia marcada sin señal persiste al volver y recargar', async ({ page, context }) => {
  await page.goto('/');
  await capturar(page, 'Tres', 'Personal');
  await page.goto('/mapa/area/personal');
  await page.getByRole('link').filter({ hasText: 'Tres' }).click();
  await expect(page.getByRole('heading', { name: 'Tres' })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Importancia 3' }).click();
  await expect(page.getByRole('button', { name: 'Importancia 3' })).toHaveAttribute('aria-pressed', 'true');
  await context.setOffline(false);
  await expect(franja(page)).toHaveCount(0, { timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Importancia 3' })).toHaveAttribute('aria-pressed', 'true');
});
