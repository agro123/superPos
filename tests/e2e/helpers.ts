import { expect, type Page } from '@playwright/test';

/** Usuarios del seed (scripts/seedData.ts). Solo existen en el emulador. */
export const SEED_PASSWORD = 'superpos123';
export const EMPLOYEE = 'carlos@superpos.test';
/** Administradora de la tienda (puede cerrar caja). */
export const ADMIN = 'rosa@superpos.test';

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
