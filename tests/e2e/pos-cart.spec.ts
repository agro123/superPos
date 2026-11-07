import { expect, test } from '@playwright/test';
import {
  ADMIN,
  EMPLOYEE,
  EMPLOYEE_NAME,
  login,
  openCash,
  pairTerminal,
  workerLogin,
} from './helpers';

test('terminal → login del trabajador → POS → recargar → el carrito persiste', async ({
  page,
  browser,
}) => {
  await pairTerminal(page, browser);
  await workerLogin(page, EMPLOYEE_NAME);

  // El empleado vende, pero no ve la gestión del catálogo.
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Productos' })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Vender' }).click();
  await expect(page.getByText('La caja está cerrada')).toBeVisible();
  await openCash(page);
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

test('órdenes simultáneas y productos agotados', async ({ page, browser }) => {
  await pairTerminal(page, browser);
  await workerLogin(page, EMPLOYEE_NAME);
  await openCash(page);
  await page.getByRole('link', { name: 'Vender' }).first().click();

  const products = page.getByRole('list', { name: 'Productos' });
  await expect(products.getByRole('button', { name: /Detergente 1 kg/ })).toBeDisabled();

  const cart = page.getByRole('region', { name: 'Carrito' });
  await products.getByRole('button', { name: /Arroz 500 g/ }).click();
  await cart.getByRole('button', { name: 'Nueva orden' }).click();
  await expect(cart.getByRole('tab', { name: 'Orden 2' })).toHaveAttribute('aria-selected', 'true');
  await expect(cart.getByText('El carrito está vacío')).toBeVisible();
  await cart.getByRole('tab', { name: /Orden 1/ }).click();
  await expect(cart.getByText('1 artículo', { exact: true })).toBeVisible();
});

test('abrir caja → vender en efectivo y tarjeta → resumen y cierre', async ({ page }) => {
  await login(page, ADMIN);
  await openCash(page, '50000');
  await page.getByRole('link', { name: 'Vender' }).first().click();

  const products = page.getByRole('list', { name: 'Productos' });
  const cart = page.getByRole('region', { name: 'Carrito' });
  const pay = async (method: 'Efectivo' | 'Tarjeta') => {
    await cart.getByRole('button', { name: /Cobrar/ }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByRole('radio', { name: method }).click();
    if (method === 'Efectivo') await sheet.getByRole('button', { name: 'Monto exacto' }).click();
    await sheet.getByRole('button', { name: 'Confirmar cobro' }).click();
    await expect(page.getByText(/Venta .+ registrada/).first()).toBeVisible();
  };
  await products.getByRole('button', { name: /Arroz 500 g/ }).click();
  await pay('Efectivo');
  await products.getByRole('button', { name: /Huevos AA x 12/ }).click();
  await pay('Tarjeta');

  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: 'Caja' })
    .click();
  await page.getByRole('button', { name: 'Cerrar caja' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cerrar caja' });
  await expect(dialog.getByText('$ 53.200')).toBeVisible(); // base + efectivo
  await expect(dialog.getByText('$ 9.800').first()).toBeVisible(); // tarjeta
  await dialog.getByLabel('Efectivo contado').fill('53200');
  await expect(dialog.getByText('La caja cuadra')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar caja' }).click();
  await expect(page.getByText('La caja está cerrada')).toBeVisible();
});

test('un empleado fuera de un terminal no vende; cambiar de trabajador cierra la sesión', async ({
  page,
  browser,
}) => {
  await login(page, EMPLOYEE);
  await page.goto('/pos');
  await expect(page.getByText('Este dispositivo no es un terminal autorizado')).toBeVisible();

  const terminal = await browser.newPage();
  await pairTerminal(terminal, browser);
  await workerLogin(terminal, EMPLOYEE_NAME);
  await terminal
    .getByRole('button', { name: /Carlos/ })
    .first()
    .click();
  await terminal.getByRole('menuitem', { name: 'Cambiar de trabajador' }).click();
  await expect(terminal.getByRole('heading', { name: '¿Quién va a trabajar?' })).toBeVisible();
  await terminal.close();
});

test('un empleado sin permiso ve "sin acceso" en una ruta protegida', async ({ page }) => {
  await login(page, EMPLOYEE);
  await page.goto('/catalog');
  await expect(page.getByText('No tienes acceso a esta sección')).toBeVisible();
});

test('cliente con saldo → pago mixto con fiado → anular → cartera en Clientes', async ({
  page,
}) => {
  await login(page, ADMIN);
  await openCash(page);
  await page.getByRole('link', { name: 'Vender' }).first().click();

  await page
    .getByRole('list', { name: 'Productos' })
    .getByRole('button', { name: /Arroz 500 g/ })
    .click();
  const cart = page.getByRole('region', { name: 'Carrito' });
  await cart.getByRole('button', { name: 'Agregar cliente' }).click();
  await page
    .getByRole('dialog', { name: 'Cliente de la venta' })
    .getByRole('button', { name: /Marta Lucía Ospina/ })
    .click();
  // El cajero ve el saldo pendiente del cliente.
  await expect(cart.getByRole('status').filter({ hasText: 'saldo pendiente' })).toBeVisible();

  await cart.getByRole('button', { name: /Cobrar/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Cobrar' });
  const pad = sheet.getByRole('group', { name: /teclado/i });
  for (const digit of ['2', '0', '0', '0'])
    await pad.getByRole('button', { name: digit, exact: true }).click();
  await sheet.getByRole('button', { name: 'Agregar pago' }).click();
  await sheet.getByRole('radio', { name: 'Fiado' }).click();
  await sheet.getByRole('button', { name: 'Confirmar cobro' }).click();
  await expect(page.getByText('Fiado: $ 1.200').first()).toBeVisible();

  await page.getByRole('link', { name: 'Ventas' }).first().click();
  await page
    .getByRole('table', { name: 'Historial de ventas' })
    .getByRole('row')
    .filter({ hasText: 'Efectivo + Fiado' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Anular venta' }).click();
  const dialog = page.getByRole('dialog', { name: /Anular la venta/ });
  await dialog.getByLabel('Motivo de la anulación').fill('Error de prueba');
  await dialog.getByRole('button', { name: 'Anular venta' }).click();
  await expect(page.getByText(/Venta .+ anulada/).first()).toBeVisible();

  await page.getByRole('link', { name: 'Clientes' }).first().click();
  await page.getByText('Solo clientes con saldo pendiente').click();
  await expect(page.getByRole('cell', { name: /Marta Lucía Ospina/ }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: /Jorge Restrepo/ })).toHaveCount(0);
});
