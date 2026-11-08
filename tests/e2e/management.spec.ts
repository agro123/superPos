import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('roles: crear "Cajero" desde plantilla y asignarlo a un empleado', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto('/settings/employees');
  await page.getByRole('button', { name: 'Nuevo rol' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nuevo rol' });
  await dialog.getByLabel('Empezar desde una plantilla').click();
  await page.getByRole('option', { name: 'Cajero' }).click();
  await expect(dialog.getByLabel('Nombre')).toHaveValue('Cajero');
  await expect(dialog.getByRole('checkbox', { name: 'Cerrar caja' })).toBeChecked();
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  const roles = page.getByRole('table', { name: 'Roles personalizados' });
  await expect(roles.getByRole('cell', { name: 'Cajero', exact: true }).first()).toBeVisible();

  await page
    .getByRole('table', { name: 'Empleados del negocio' })
    .getByRole('row')
    .filter({ hasText: 'Carlos' })
    .first()
    .getByRole('button', { name: 'Editar' })
    .click();
  const editor = page.getByRole('dialog', { name: /Editar acceso de Carlos/ });
  await editor.getByLabel('Rol').click();
  await page.getByRole('option', { name: 'Cajero' }).first().click();
  await editor.getByRole('button', { name: 'Guardar' }).click();
  await expect(
    page
      .getByRole('table', { name: 'Empleados del negocio' })
      .getByRole('row')
      .filter({ hasText: 'Carlos' })
      .first(),
  ).toContainText('Cajero');
});

test('ticket: imagen/PDF y envío por WhatsApp o correo', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto('/sales');
  await page
    .getByRole('table', { name: 'Historial de ventas' })
    .getByRole('row')
    .filter({ hasText: '$' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Compartir ticket' }).click();
  const dialog = page.getByRole('dialog', { name: 'Compartir ticket' });
  await expect(dialog.getByRole('img', { name: 'Vista previa del ticket' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'WhatsApp', exact: true })).toHaveAttribute(
    'href',
    /wa\.me\/\d*\?text=.*Ticket/,
  );
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Descargar PDF' }).click();
  expect((await download).suggestedFilename()).toMatch(/^ticket-.+\.pdf$/);
});

test('caja desde fuera del local: todas las cajas en Inicio y en Caja', async ({ page }) => {
  await login(page, ADMIN);
  await expect(page.getByRole('heading', { name: 'Todas las cajas' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Últimos cierres' })).toContainText('Caja SEED');
  await page.getByRole('link', { name: 'Ver caja y movimientos' }).click();
  await page
    .getByRole('table', { name: 'Turnos de caja' })
    .getByRole('row')
    .filter({ hasText: 'Cerrada' })
    .first()
    .click();
  await expect(page.getByRole('link', { name: 'Enviar resumen por WhatsApp' })).toHaveAttribute(
    'href',
    /Cierre%20de%20caja/,
  );
});

test('reportes: ganancia, desempeño y exportación a Excel y PDF', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto('/reports');
  await page.getByRole('tab', { name: 'Ganancia' }).click();
  await expect(page.getByText('Resultado estimado')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Ganancia por categoría' })).toBeVisible();
  await page.getByRole('tab', { name: 'Trabajadores' }).click();
  await expect(page.getByRole('table', { name: 'Desempeño por trabajador' })).toContainText(
    /Rosa|Carlos|Ana/,
  );

  const excel = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar a Excel' }).click();
  expect((await excel).suggestedFilename()).toBe('reporte-14-dias.xlsx');
  const pdf = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar a PDF' }).click();
  expect((await pdf).suggestedFilename()).toBe('reporte-14-dias.pdf');
});
