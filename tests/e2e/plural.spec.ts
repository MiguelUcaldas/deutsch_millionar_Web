import { expect, test, type Page } from '@playwright/test';
import { abrir, comenzar, responder } from './ayudas';
import { revisarMaquetacion } from './maquetacion';
import { ES_ALEMAN } from './temario';

// Usa el tema «der / die / das» del temario alemán.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

/** La tarjeta «Oración completa» del resultado. */
const oracionCompleta = (page: Page) =>
  page.locator('section.bloque', { has: page.getByRole('heading', { name: 'Oración completa' }) });
const bloquePlural = (page: Page) => oracionCompleta(page).getByRole('group', { name: 'Plural' });

test.describe('el plural en «Oración completa» (der / die / das)', () => {
  test('no se muestra durante la pregunta (delataría el artículo) y sí en el resultado', async ({
    page,
  }) => {
    await abrir(page, { reloj: true, temas: ['der_die_das'] });
    await comenzar(page);
    await expect(page.getByRole('group', { name: 'Plural' })).toHaveCount(0);
    await responder(page, true, true);

    await expect(bloquePlural(page)).toBeVisible();
    await expect(bloquePlural(page).getByText(/plural · mehrzahl/i)).toBeVisible();
    // El plural lleva siempre «die» y se explica el porqué.
    await expect(bloquePlural(page).locator('.forma')).toHaveText(/^die \S+$/);
    await expect(bloquePlural(page).getByText('En plural el artículo siempre es')).toBeVisible();
  });

  test('la traducción ya no esconde el plural detrás de una flecha', async ({ page }) => {
    await abrir(page, { reloj: true, temas: ['der_die_das'] });
    await comenzar(page);
    await responder(page, true, true);
    const traduccion = oracionCompleta(page).locator('.traduccion');
    await expect(traduccion).toHaveText(/^(der|die|das) \S+ · /);
    await expect(traduccion).not.toContainText('→');
  });

  test('también se ve tras equivocarse', async ({ page }) => {
    await abrir(page, { reloj: true, temas: ['der_die_das'] });
    await comenzar(page);
    await responder(page, false, true);
    await expect(bloquePlural(page)).toBeVisible();
  });

  for (const ancho of [360, 768, 1280]) {
    test(`el resultado con el plural cabe sin encimarse · ${ancho}px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 });
      await abrir(page, { reloj: true, temas: ['der_die_das'] });
      await comenzar(page);
      await responder(page, true, true);
      await expect(bloquePlural(page)).toBeVisible();
      expect(await revisarMaquetacion(page, 'resultado: plural')).toEqual([]);
    });
  }
});
