import { expect, type Browser, type Page } from '@playwright/test';

/** Usuarios del seed (scripts/seedData.ts). Solo existen en el emulador. */
export const SEED_PASSWORD = 'superpos123';
export const EMPLOYEE = 'carlos@superpos.test';
/** Administradora de la tienda (puede cerrar caja). */
export const ADMIN = 'rosa@superpos.test';
export const EMPLOYEE_NAME = 'Carlos Pérez';

export async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Contraseña').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
}

/** Abre la caja de este navegador (cada contexto de Playwright es un dispositivo nuevo). */
export async function openCash(page: Page, base = '50000'): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: 'Caja' })
    .click();
  await page.getByRole('button', { name: 'Abrir caja' }).click();
  const dialog = page.getByRole('dialog', { name: 'Abrir caja' });
  await dialog.getByLabel('Base de efectivo').fill(base);
  await dialog.getByRole('button', { name: 'Abrir caja' }).click();
  await expect(page.getByRole('heading', { name: /Caja abierta desde/ })).toBeVisible();
}

/**
 * Convierte el navegador de `page` en un terminal autorizado: muestra el QR de vinculación y una
 * administradora lo aprueba desde otro contexto (otro dispositivo). Termina en la selección de
 * trabajador.
 */
export async function pairTerminal(page: Page, browser: Browser, name = 'Caja e2e'): Promise<void> {
  await page.goto('/terminal');
  await page.getByRole('button', { name: 'Registrar dispositivo' }).click();
  const code = await page.getByText(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/).textContent();
  if (!code) throw new Error('Sin código de vinculación');

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await login(admin, ADMIN);
  await admin.goto('/settings/terminals');
  await admin.getByRole('button', { name: 'Vincular terminal' }).click();
  const dialog = admin.getByRole('dialog', { name: 'Vincular terminal' });
  await dialog.getByLabel('Código del dispositivo').fill(code);
  await dialog.getByRole('button', { name: 'Buscar' }).click();
  await dialog.getByLabel('Nombre del terminal').fill(name);
  await dialog.getByRole('button', { name: 'Autorizar terminal' }).click();
  await expect(admin.getByRole('cell', { name, exact: true }).first()).toBeVisible();
  await adminContext.close();

  await expect(page.getByRole('heading', { name: '¿Quién va a trabajar?' })).toBeVisible();
}

/** En un terminal autorizado: elige el perfil y entra con contraseña. */
export async function workerLogin(page: Page, displayName: string): Promise<void> {
  await page
    .getByRole('list', { name: 'Trabajadores' })
    .getByRole('button', { name: new RegExp(displayName) })
    .click();
  await page.getByLabel(`Contraseña de ${displayName}`).fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/pos$/);
}
