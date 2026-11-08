import { expect, test, type Page } from '@playwright/test';
import { ADMIN, SEED_PASSWORD } from './helpers';

/** Ana es admin del Café (plan gratis) y empleada del Minimercado: elige el Café. */
async function loginFreeBusiness(page: Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('ana@superpos.test');
  await page.getByLabel('Contraseña').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: /Café La Esquina/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
}

test('plan gratis: reportes, roles y cupos bloqueados, con indicadores y solicitud de cambio', async ({
  page,
}) => {
  await loginFreeBusiness(page);
  await expect(page.getByRole('link', { name: 'Plan Gratis: ver detalles' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: /Reportes/ })).toContainText('Premium');

  await page.goto('/reports');
  await expect(
    page.getByRole('heading', { name: 'Los reportes son parte del plan Premium' }),
  ).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Ganancia' })).toHaveCount(0);

  await page.goto('/settings/employees');
  await expect(page.getByText('Cupos de trabajador: 1 de 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invitar empleado' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Nuevo rol' })).toBeDisabled();

  await page.goto('/sales');
  await page.getByLabel('Periodo').click();
  await expect(page.getByRole('option', { name: 'Últimos 90 días (Premium)' })).toHaveAttribute(
    'data-disabled',
    '',
  );
  await page.keyboard.press('Escape');

  await page.goto('/settings/plan');
  await expect(page.getByRole('heading', { name: 'Plan Gratis' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Llamar al/ })).toHaveAttribute(
    'href',
    'tel:+576025550142',
  );
  await expect(page.getByRole('link', { name: /Escribir a planes@superpos.app/ })).toHaveAttribute(
    'href',
    /planes%40superpos\.app.*Premium/,
  );
  await expect(page.getByRole('button', { name: 'Descargar respaldo (Excel)' })).toBeDisabled();
});

test('plan premium: indicador, reportes abiertos y respaldo completo', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN);
  await page.getByLabel('Contraseña').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Plan Premium: ver detalles' }).click();
  await expect(page.getByRole('heading', { name: 'Plan Premium' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar respaldo (Excel)' }).click();
  expect((await download).suggestedFilename()).toBe('respaldo-tienda-rosa.xlsx');

  await page.goto('/settings/employees');
  await expect(page.getByText('Cupos de trabajador: 2 de 3')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invitar empleado' })).toBeEnabled();
});
