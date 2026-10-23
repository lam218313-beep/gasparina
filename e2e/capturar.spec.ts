import { test, expect, type Page } from './fixtures';

// Las pruebas de este archivo van en orden y comparten un usuario nuevo (ver fixtures.ts).

async function abrirCaptura(page: Page) {
  await page.getByRole('button', { name: 'Capturar' }).click();
  return page.getByRole('dialog', { name: 'Capturar' });
}

test('capturar algo lo deja en la bandeja', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill('Llamar al banco');
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
  await page.goto('/bandeja');
  await expect(page.getByRole('article', { name: 'Llamar al banco' })).toBeVisible();
});

test('con solo espacios no se puede guardar', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill('   ');
  await expect(hoja.getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('ordenar desde la bandeja: área, importancia y Siguiente', async ({ page }) => {
  await page.goto('/bandeja');
  const tarjeta = page.getByRole('article', { name: 'Llamar al banco' });
  await tarjeta.getByRole('button', { name: 'Universidad' }).click();
  await tarjeta.getByRole('button', { name: 'Importancia 4' }).click();
  await tarjeta.getByRole('button', { name: 'Siguiente' }).click();
  await expect(tarjeta).toHaveCount(0);
  await page.goto('/mapa/area/universidad');
  const fila = page.getByRole('listitem').filter({ hasText: 'Llamar al banco' });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('UNI-1');
});

test('capturar con área va directo al mapa, sin pasar por la bandeja', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill('Reunión con el equipo');
  await hoja.getByRole('button', { name: 'Pixely' }).click();
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
  await page.goto('/bandeja');
  await expect(page.getByRole('article', { name: 'Reunión con el equipo' })).toHaveCount(0);
  await page.goto('/mapa/area/pixely');
  await expect(page.getByRole('listitem').filter({ hasText: 'Reunión con el equipo' })).toBeVisible();
});

test('Siguiente sin área pide elegir una y no mueve el ítem', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill('Sin área todavía');
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
  await page.goto('/bandeja');
  const tarjeta = page.getByRole('article', { name: 'Sin área todavía' });
  await tarjeta.getByRole('button', { name: 'Siguiente' }).click();
  await expect(tarjeta.getByText('Elige un área')).toBeVisible();
  await expect(tarjeta).toBeVisible();
});

test('descartar pide confirmar antes de esconder la tarjeta', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill('Por error');
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
  await page.goto('/bandeja');
  const tarjeta = page.getByRole('article', { name: 'Por error' });
  await tarjeta.getByRole('button', { name: 'Descartar' }).click();
  await expect(tarjeta).toBeVisible();
  await tarjeta.getByRole('button', { name: '¿Seguro? Descartar' }).click();
  await expect(tarjeta).toHaveCount(0);
});

test('"Esta noche" solo existe para los eventos', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await expect(hoja.getByLabel('Esta noche')).toHaveCount(0);
  await hoja.getByLabel('Es un evento').check();
  await expect(hoja.getByLabel('Esta noche')).toHaveCount(1);
});

test('capturar un evento con hora', async ({ page }) => {
  await page.goto('/');
  const hoja = await abrirCaptura(page);
  await hoja.getByPlaceholder('¿Qué hay que hacer?').fill('Dentista');
  await hoja.getByRole('button', { name: 'Personal' }).click();
  await hoja.getByLabel('Es un evento').check();
  await hoja.getByLabel('Hora').fill('15:00');
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardado');
  await page.goto('/mapa/area/personal');
  const fila = page.getByRole('listitem').filter({ hasText: 'Dentista' });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('15:00');
});
