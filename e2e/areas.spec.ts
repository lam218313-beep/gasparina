import { test, expect } from './fixtures';

// El fixture entra con un usuario recién creado: la app le crea sus seis áreas la primera vez.
test('un usuario nuevo recibe las seis áreas, en orden', async ({ page }) => {
  await page.goto('/mapa');
  const nombres = page.getByRole('list', { name: 'Áreas' }).getByRole('heading', { level: 3 });
  await expect(nombres).toHaveText(['Pixely', 'Trabajo fijo', 'Trabajos temporales', 'Universidad', 'Emprendimientos', 'Personal']);
});
