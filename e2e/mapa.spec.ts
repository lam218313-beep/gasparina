import { test, expect, type Page } from './fixtures';

// Las pruebas de este archivo van en orden y comparten un usuario nuevo (ver fixtures.ts).

async function crearDesde(page: Page, boton: string, titulo: string) {
  await page.getByRole('button', { name: boton }).click();
  const hoja = page.getByRole('dialog');
  await hoja.getByLabel('Título').fill(titulo);
  await hoja.getByRole('button', { name: 'Crear' }).click();
  await expect(hoja).toHaveCount(0);
}

test('el mapa lista las seis áreas', async ({ page }) => {
  await page.goto('/mapa');
  const nombres = page.getByRole('list', { name: 'Áreas' }).getByRole('heading', { level: 3 });
  await expect(nombres).toHaveText(['Pixely', 'Trabajo fijo', 'Trabajos temporales', 'Universidad', 'Emprendimientos', 'Personal']);
});

test('un proyecto nuevo aparece en Proyectos con 0/0', async ({ page }) => {
  await page.goto('/mapa/area/pixely');
  await crearDesde(page, 'Nuevo proyecto', 'Campaña Casa Norte');
  const fila = page.getByRole('list', { name: 'Proyectos' }).getByRole('listitem').filter({ hasText: 'Campaña Casa Norte' });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('0/0');
});

test('las tareas del proyecto suman al progreso', async ({ page }) => {
  await page.goto('/mapa/area/pixely');
  await page.getByRole('link').filter({ hasText: 'Campaña Casa Norte' }).click();
  await crearDesde(page, 'Añadir tarea', 'Tarea uno');
  await crearDesde(page, 'Añadir tarea', 'Tarea dos');
  const dentro = page.getByRole('list', { name: 'Dentro' });
  await expect(dentro.getByRole('listitem')).toHaveCount(2);
  await dentro.getByRole('link').filter({ hasText: 'Tarea uno' }).click();
  await page.getByLabel('Estado').selectOption('hecho');
  await expect(page.getByLabel('Estado')).toHaveValue('hecho');
  await page.goto('/mapa/area/pixely');
  const fila = page.getByRole('list', { name: 'Proyectos' }).getByRole('listitem').filter({ hasText: 'Campaña Casa Norte' });
  await expect(fila).toContainText('1/2');
});

test('la ficha muestra la ruta y el código', async ({ page }) => {
  await page.goto('/mapa/area/pixely');
  await page.getByRole('link').filter({ hasText: 'Campaña Casa Norte' }).click();
  await page.getByRole('list', { name: 'Dentro' }).getByRole('link').filter({ hasText: 'Tarea uno' }).click();
  await expect(page.getByText('Pixely › Campaña Casa Norte')).toBeVisible();
  await expect(page.getByText('PIX-2', { exact: true })).toBeVisible();
});

test('el historial cuenta la creación y el cambio de estado', async ({ page }) => {
  await page.goto('/mapa/area/pixely');
  await page.getByRole('link').filter({ hasText: 'Campaña Casa Norte' }).click();
  await page.getByRole('list', { name: 'Dentro' }).getByRole('link').filter({ hasText: 'Tarea uno' }).click();
  const historial = page.getByRole('list', { name: 'Historial' });
  await expect(historial).toContainText('Creado');
  await expect(historial).toContainText('Estado: siguiente → hecho');
});

test('nada puede quedar dentro de sí mismo', async ({ page }) => {
  await page.goto('/mapa/area/pixely');
  await page.getByRole('link').filter({ hasText: 'Campaña Casa Norte' }).click();
  await page.getByRole('list', { name: 'Dentro' }).getByRole('link').filter({ hasText: 'Tarea uno' }).click();
  await page.getByRole('button', { name: 'Editar' }).click();
  let hoja = page.getByRole('dialog', { name: 'Editar' });
  await hoja.getByLabel('Padre').fill('Tarea uno');
  await expect(hoja.getByRole('button', { name: 'Tarea uno' })).toHaveCount(0);
  await hoja.getByRole('button', { name: 'Cerrar' }).click();

  // El proyecto no puede colgar de su propia tarea: la base lo rechaza.
  await page.goto('/mapa/area/pixely');
  await page.getByRole('link').filter({ hasText: 'Campaña Casa Norte' }).click();
  await page.getByRole('button', { name: 'Editar' }).click();
  hoja = page.getByRole('dialog', { name: 'Editar' });
  await hoja.getByLabel('Padre').fill('Tarea dos');
  await hoja.getByRole('button', { name: 'Tarea dos' }).click();
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(hoja.getByText('No puede quedar dentro de sí mismo')).toBeVisible();
});
