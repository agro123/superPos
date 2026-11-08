import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('inventario: entrada de mercancía y sugerencia de reabastecimiento', async ({ page }) => {
  await login(page, ADMIN);
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: /Inventario/ })
    .click();

  const stock = page.getByRole('table', { name: 'Stock por producto' });
  const row = stock.getByRole('row').filter({ hasText: 'Azúcar 1 kg' }).first();
  await row.getByRole('button', { name: 'Entrada' }).click();
  const dialog = page.getByRole('dialog', { name: /Entrada de mercancía/ });
  await dialog.getByLabel('Unidades recibidas').fill('10');
  await expect(dialog.getByRole('status')).toContainText('quedarán 13');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(row).toContainText('13');

  await page.getByRole('tab', { name: 'Reabastecer' }).click();
  const reorder = page.getByRole('table', { name: 'Productos para reabastecer' });
  await expect(
    reorder.getByRole('row').filter({ hasText: 'Detergente 1 kg' }).first(),
  ).toContainText('Agotado');
  await expect(page.getByRole('link', { name: 'Enviar pedido por WhatsApp' })).toHaveAttribute(
    'href',
    /wa\.me/,
  );

  await page.getByRole('tab', { name: 'Movimientos' }).click();
  await expect(
    page
      .getByRole('table', { name: 'Movimientos de inventario' })
      .getByRole('row')
      .filter({ hasText: 'Azúcar 1 kg' })
      .first(),
  ).toContainText('+10');
});

test('reportes: ventas por hora, medios de pago y exportación', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'Ventas por hora del día' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cómo pagan tus clientes' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar ventas (CSV)' }).click();
  expect((await download).suggestedFilename()).toMatch(/^ventas-\d+-dias\.csv$/);
});

test('catálogo público: el dueño publica, un cliente sin sesión pide por WhatsApp', async ({
  page,
  browser,
}) => {
  await login(page, ADMIN);
  await page.goto('/settings/storefront');
  await page.getByRole('switch', { name: 'Publicar el catálogo' }).click();
  const slug = await page.getByLabel('Dirección del catálogo').inputValue();
  await page.getByLabel('WhatsApp para pedidos a domicilio').fill('300 123 4567');
  // El dueño decide qué se muestra: oculta un producto.
  await page.getByRole('switch', { name: 'Mostrar Jabón de baño en el catálogo' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('button', { name: 'Compartir y QR' })).toBeVisible();

  await page.getByRole('button', { name: 'Compartir y QR' }).click();
  const share = page.getByRole('dialog', { name: 'Compartir catálogo' });
  await expect(share.getByRole('img', { name: /Código QR del catálogo/ })).toBeVisible();
  await expect(share.getByRole('link', { name: 'WhatsApp', exact: true })).toHaveAttribute(
    'href',
    /wa\.me\/\?text=.*%2Fc%2F/,
  );
  await expect(share.getByRole('link', { name: /Enviar por correo/ })).toHaveAttribute(
    'href',
    /^mailto:/,
  );
  await page.keyboard.press('Escape');

  const customer = await (await browser.newContext()).newPage();
  // La publicación es asíncrona (sincroniza desde la sesión del dueño).
  await expect(async () => {
    await customer.goto(`/c/${slug}`);
    await expect(customer.getByRole('list', { name: 'Productos' })).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  const products = customer.getByRole('list', { name: 'Productos' });
  await expect(products.getByText('Jabón de baño')).toHaveCount(0);
  await products
    .getByRole('listitem')
    .filter({ hasText: 'Arroz 500 g' })
    .getByRole('button', { name: 'Agregar al pedido' })
    .click();
  await customer.getByRole('button', { name: /Pedir por WhatsApp/ }).click();
  const order = customer.getByRole('dialog', { name: 'Pedido a domicilio' });
  await order.getByLabel('Dirección de entrega').fill('Calle 5 # 10-20');
  const href = await order
    .getByRole('link', { name: 'Abrir WhatsApp y enviar' })
    .getAttribute('href');
  expect(href).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
  expect(decodeURIComponent(href ?? '')).toContain('1 × Arroz 500 g');
  expect(decodeURIComponent(href ?? '')).toContain('Dirección: Calle 5 # 10-20');
});
