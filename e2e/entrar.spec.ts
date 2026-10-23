import { test, expect, SEED } from './fixtures';

test.use({ signedIn: false });

test('sin sesión, la raíz lleva a Entrar', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole('heading', { name: 'Entrar.' })).toBeVisible();
});

test('entra con correo y contraseña y llega a Hoy', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill(SEED.email);
  await page.getByLabel('Contraseña').fill(SEED.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Hoy.' })).toBeVisible();
});

test('con la contraseña incorrecta avisa y sigue en Entrar', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill(SEED.email);
  await page.getByLabel('Contraseña').fill('equivocada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible();
  await expect(page).toHaveURL(/\/entrar$/);
});
