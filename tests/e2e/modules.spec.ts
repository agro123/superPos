import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('activar el módulo de restaurante muestra Mesas y se guarda en el servidor', async ({
  page,
}) => {
  await login(page, ADMIN);
  await page.goto('/settings/modules');
  const restaurant = page.getByRole('switch', { name: /Restaurante/ });
  await expect(restaurant).not.toBeChecked();
  await restaurant.click();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Mesas' })).toBeVisible();
  // Con sincronización terminada y recarga: el cambio no lo revirtieron las reglas.
  await expect(page.getByText('En línea').first()).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page.getByRole('switch', { name: /Restaurante/ })).toBeChecked();
  await page.getByRole('switch', { name: /Restaurante/ }).click();
  await expect(nav.getByRole('link', { name: 'Mesas' })).toHaveCount(0);
});
