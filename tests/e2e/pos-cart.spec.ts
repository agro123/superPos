import { expect, test } from '@playwright/test';
import { EMPLOYEE, login } from './helpers';

test('login → POS → agregar al carrito → recargar → el carrito persiste', async ({ page }) => {
  await login(page, EMPLOYEE);

  // El empleado vende, pero no ve la gestión del catálogo.
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Productos' })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Vender' }).click();

  const products = page.getByRole('list', { name: 'Productos' });
  await products.getByRole('button', { name: /Arroz 500 g/ }).click();
  await products.getByRole('button', { name: /Arroz 500 g/ }).click();
  await products.getByRole('button', { name: /Leche entera/ }).click();

  const cart = page.getByRole('region', { name: 'Carrito' });
  await expect(cart.getByText('3 artículos')).toBeVisible();
  await expect(cart.getByRole('button', { name: 'Cobrar $ 10.900' })).toBeVisible();

  await page.reload();

  await expect(cart.getByText('3 artículos')).toBeVisible();
  await expect(cart.getByRole('group', { name: 'Cantidad: Arroz 500 g' })).toContainText('2');
  await expect(cart.getByRole('button', { name: 'Cobrar $ 10.900' })).toBeVisible();
});

test('un empleado sin permiso ve "sin acceso" en una ruta protegida', async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto('/catalog');
  await expect(page.getByText('No tienes acceso a esta sección')).toBeVisible();
});
