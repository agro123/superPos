import { expect, test } from '@playwright/test';
import { openCash, SEED_PASSWORD } from './helpers';

test('restaurante: abrir mesa → pedido → cocina → cobrar en caja libera la mesa', async ({
  page,
}) => {
  // Ana administra el Café (módulo restaurante activo en el seed).
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('ana@superpos.test');
  await page.getByLabel('Contraseña').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: /Café La Esquina/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
  await openCash(page);

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('link', { name: 'Mesas' }).click();
  await page.getByRole('button', { name: /Mesa 1/ }).click();
  await page.getByLabel('Comensales').fill('3');
  await page.getByRole('button', { name: 'Abrir mesa' }).click();
  await expect(page.getByRole('heading', { name: 'Comanda · Mesa 1' })).toBeVisible();

  const products = page.getByRole('list', { name: 'Productos' });
  await products.getByRole('button', { name: /Tinto/ }).click();
  await products.getByRole('button', { name: /Tinto/ }).click();
  await products.getByRole('button', { name: /Croissant/ }).click();
  await page.getByRole('button', { name: 'Enviar a cocina (3)' }).click();
  await expect(page.getByText('Ronda 1').first()).toBeVisible();

  await nav.getByRole('link', { name: 'Cocina' }).click();
  const ticket = page
    .getByRole('list', { name: 'Cocina' })
    .getByRole('listitem')
    .filter({ hasText: 'Mesa 1' })
    .first();
  await expect(ticket).toContainText('2 × Tinto');
  await ticket.getByRole('button', { name: 'Listo para servir' }).click();
  await expect(page.getByText('No hay pedidos pendientes')).toBeVisible();

  await nav.getByRole('link', { name: 'Mesas' }).click();
  await expect(page.getByRole('button', { name: /Mesa 1/ })).toContainText('Servida');
  await page.getByRole('button', { name: /Mesa 1/ }).click();
  await page.getByRole('button', { name: 'Cobrar en caja' }).click();

  // En el POS, la orden lleva el nombre de la mesa y las líneas de la comanda.
  const cart = page.getByRole('region', { name: 'Carrito' });
  await expect(cart.getByRole('tab', { name: /Mesa 1/ })).toHaveAttribute('aria-selected', 'true');
  await cart.getByRole('button', { name: /Cobrar/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Cobrar' });
  await sheet.getByRole('radio', { name: 'Efectivo' }).click();
  await sheet.getByRole('button', { name: 'Monto exacto' }).click();
  await sheet.getByRole('button', { name: 'Confirmar cobro' }).click();
  await expect(page.getByText(/Venta .+ registrada/).first()).toBeVisible();

  await nav.getByRole('link', { name: 'Mesas' }).click();
  await expect(page.getByRole('button', { name: /Mesa 1/ })).toContainText('Libre');
});
