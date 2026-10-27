import { expect, test } from '@playwright/test';
import { SUSPENSO_MS, abrir, avanzar, comenzar, opcionCorrecta, responder } from './ayudas';
import { ES_ALEMAN } from './temario';

// Usa los textos de pausa del temario alemán («Ein Pausebrot»).
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

const botonPausa = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Pausar (Ein Pausebrot)' });
const tarjeta = (page: import('@playwright/test').Page) => page.getByRole('dialog');

test.describe('pausa «Ein Pausebrot»', () => {
  test('tapa la pregunta por completo, congela el tiempo y reanuda donde iba', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await avanzar(page, 3000);
    const contador = page.locator('[role="timer"]');
    const antes = await contador.innerText();

    await botonPausa(page).click();
    await expect(tarjeta(page).getByRole('heading', { name: 'Ein Pausebrot' })).toBeVisible();
    await expect(page.getByText('Tómate un respiro. La pregunta te espera.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Weiter · Continuar' })).toBeFocused();
    // El enunciado, las opciones y el reloj no se ven: la pausa no sirve para pensar.
    await expect(page.locator('h2[lang]')).toBeHidden();
    await expect(page.locator('[data-opcion]').first()).toBeHidden();
    await expect(contador).toBeHidden();

    await avanzar(page, 60_000);
    await page.keyboard.press('a');
    await expect(tarjeta(page)).toBeVisible();

    await page.getByRole('button', { name: 'Weiter · Continuar' }).click();
    await expect(tarjeta(page)).toHaveCount(0);
    await expect(page.locator('[data-opcion]').first()).toBeVisible();
    await expect(contador).toHaveText(antes);
    await expect(botonPausa(page)).toBeFocused();

    await avanzar(page, 2000);
    await expect(contador).not.toHaveText(antes);
  });

  test('P pausa y reanuda; Escape también reanuda', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await page.keyboard.press('p');
    await expect(tarjeta(page)).toBeVisible();
    await page.keyboard.press('p');
    await expect(tarjeta(page)).toHaveCount(0);
    await page.keyboard.press('p');
    await expect(tarjeta(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tarjeta(page)).toHaveCount(0);
    await expect(page.locator('[data-opcion]').first()).toBeVisible();
  });

  test('pausar en medio del suspenso retrasa la revelación', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await opcionCorrecta(page).click();
    await avanzar(page, 500);
    await botonPausa(page).click();
    await avanzar(page, 60_000);
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await avanzar(page, SUSPENSO_MS + 1100 - 500);
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible();
  });

  test('también se puede pausar en el resultado', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, true, true);
    await botonPausa(page).click();
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeHidden();
    await expect(page.getByRole('button', { name: /^Siguiente/ })).toBeHidden();
    await expect(tarjeta(page)).toBeVisible();
    await page.getByRole('button', { name: 'Weiter · Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible();
  });

  test('la práctica también se puede pausar', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Repaso' }).click();
    await page.getByRole('button', { name: /Preposiciones/ }).click();
    await page.getByRole('button', { name: 'Practicar este tema' }).click();
    await botonPausa(page).click();
    await expect(tarjeta(page)).toBeVisible();
    await page.getByRole('button', { name: 'Weiter · Continuar' }).click();
    await expect(page.locator('[data-opcion]').first()).toBeVisible();
  });

  test('el ícono del pan se dibuja en el botón y en la tarjeta', async ({ page }) => {
    await abrir(page);
    await comenzar(page);
    await expect(botonPausa(page).locator('svg path')).toHaveCount(1);
    await botonPausa(page).click();
    await expect(tarjeta(page).locator('svg path')).toHaveCount(1);
  });
});
