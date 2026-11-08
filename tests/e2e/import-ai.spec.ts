import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('importación masiva: plantilla, vista previa, omite existentes y crea los nuevos', async ({
  page,
}) => {
  await login(page, ADMIN);
  await page.goto('/settings/import');

  const template = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Plantilla Excel' }).click();
  expect((await template).suggestedFilename()).toBe('plantilla-productos.xlsx');

  const csv = [
    'nombre;precio;costo;categoria;controla_stock;stock_inicial',
    'Galletas de avena;2.500;1.500;Snacks;si;24',
    'Arroz 500 g;3200;;;;',
    'Galletas de avena;9999;;;;',
    'Sin precio;;;;;',
    'Panela orgánica;4.800;;Endulzantes;no;',
  ].join('\n');
  await page
    .getByLabel('Elegir archivo')
    .setInputFiles({ name: 'productos.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });

  const status = page.getByRole('status').filter({ hasText: 'nuevos' });
  await expect(status).toContainText('2 nuevos');
  await expect(status).toContainText('2 ya existen');
  await expect(status).toContainText('1 con errores');
  await expect(status).toContainText('Categorías nuevas: Endulzantes');
  await page.getByRole('button', { name: 'Crear 2 productos' }).click();
  await expect(page.getByText('2 productos importados').first()).toBeVisible();

  await page.goto('/catalog');
  await expect(page.getByText('Galletas de avena').first()).toBeVisible();
  await expect(page.getByText('Panela orgánica').first()).toBeVisible();
});

test('asesor con I.A.: sin clave o modelo configurado se bloquea el análisis', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto('/reports');
  await page.getByRole('tab', { name: 'Asesor I.A.' }).click();
  // La tienda del seed es premium. Sin VITE_GEMINI_* el análisis queda bloqueado; con una clave en
  // .env.local, el modelo se verifica antes de habilitar el botón (no se llama al análisis aquí).
  const unconfigured = page.getByText('I.A. no configurada');
  const analyze = page.getByRole('button', { name: 'Analizar con I.A.' });
  await expect(unconfigured.or(page.getByText(/^Modelo: /))).toBeVisible({ timeout: 15_000 });
  if (await unconfigured.isVisible()) await expect(analyze).toHaveCount(0);
  else await expect(analyze).toBeEnabled();
});
