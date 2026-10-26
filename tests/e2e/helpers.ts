import { expect, type Page } from '@playwright/test';

/** Usuarios del seed (scripts/seedData.ts). Solo existen en el emulador. */
export const SEED_PASSWORD = 'superpos123';
export const EMPLOYEE = 'carlos@superpos.test';

export async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Contraseña').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
}
