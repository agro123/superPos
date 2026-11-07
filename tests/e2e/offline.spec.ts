import { expect, test } from '@playwright/test';
import { EMPLOYEE_NAME, openCash, pairTerminal, workerLogin } from './helpers';

test('la app abre y navega sin conexión tras la primera visita', async ({
  page,
  context,
  browser,
}) => {
  await pairTerminal(page, browser);
  await workerLogin(page, EMPLOYEE_NAME);

  // Primera visita en línea: el Service Worker precachea el app shell y Firestore guarda la caché local.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await openCash(page);
  await page.getByRole('link', { name: 'Vender' }).first().click();
  await expect(
    page.getByRole('list', { name: 'Productos' }).getByRole('button').first(),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ventas' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ventas' })).toBeVisible();
  await page.reload(); // la página queda controlada por el Service Worker

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'Ventas' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Sin conexión' }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Vender' }).first().click();
  await expect(
    page.getByRole('list', { name: 'Productos' }).getByRole('button', { name: /Arroz 500 g/ }),
  ).toBeVisible();
  await page
    .getByRole('list', { name: 'Productos' })
    .getByRole('button', { name: /Arroz 500 g/ })
    .click();
  await expect(
    page.getByRole('region', { name: 'Carrito' }).getByText('1 artículo', { exact: true }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Inicio' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
});
