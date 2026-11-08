import { expect, test } from '@playwright/test';

test('negocio nuevo: asistente adaptado al tipo → tour una sola vez', async ({ page }) => {
  const email = `nuevo-${String(Date.now())}@superpos.test`;
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Crear cuenta' }).click();
  const signup = page.getByRole('form', { name: 'Crear cuenta' });
  await signup.getByLabel('Tu nombre').fill('Dueña Nueva');
  await signup.getByLabel('Email').fill(email);
  await signup.getByLabel('Contraseña').fill('superpos123');
  await signup.getByRole('button', { name: 'Crear cuenta' }).click();

  const create = page.getByRole('form', { name: 'Crea tu negocio' });
  // El formulario se vuelve a montar cuando termina de cargar el perfil: se reintenta hasta que
  // los valores queden.
  await expect(async () => {
    await create.getByLabel('Nombre del negocio').fill('Café Prueba');
    await create.getByLabel('Tipo de negocio').click();
    await page.getByRole('option', { name: 'Cafetería' }).click();
    await page.waitForTimeout(300);
    await expect(create.getByLabel('Nombre del negocio')).toHaveValue('Café Prueba');
    await expect(create.getByLabel('Tipo de negocio')).toHaveText('Cafetería');
  }).toPass({ timeout: 15_000 });
  await create.getByRole('button', { name: 'Crear negocio' }).click();

  // Un negocio recién creado entra al asistente.
  await expect(page).toHaveURL(/\/setup$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Tu negocio' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByText(/Recomendado para tu tipo de negocio/)).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Categorías sugeridas para una cafetería.
  await expect(page.getByLabel('Cafés')).toBeChecked();
  await page.getByRole('button', { name: /^Crear \d+ categorías$/ }).click();
  await expect(page.getByText('Ya tienes todas las categorías sugeridas.')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByRole('checkbox', { name: 'Capuchino' })).toBeChecked();
  await page.getByRole('button', { name: /^Crear \d+ productos$/ }).click();
  await expect(page.getByText(/^Ya tienes \d+ productos\.$/)).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Los pasos opcionales se pueden omitir.
  for (let i = 0; i < 5; i += 1)
    await page.getByRole('button', { name: 'Omitir este paso' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '¡Listo!' })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar a vender' }).click();

  // Tour guiado, una sola vez.
  const tour = page.getByRole('dialog', { name: '¡Bienvenido a SuperPOS!' });
  await expect(tour).toBeVisible();
  await tour.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('dialog', { name: 'Inicio' })).toBeVisible();
  await page.getByRole('button', { name: 'Saltar tour' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Las escrituras no se esperan (offline-first): antes de recargar, que terminen de sincronizar.
  await expect(page.getByText('En línea').first()).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Hola/ })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  // Se puede volver a ver desde el menú.
  await page.getByRole('button', { name: /Menú de usuario/ }).click();
  await page.getByRole('menuitem', { name: 'Ver el tour otra vez' }).click();
  await expect(page.getByRole('dialog', { name: '¡Bienvenido a SuperPOS!' })).toBeVisible();
});
