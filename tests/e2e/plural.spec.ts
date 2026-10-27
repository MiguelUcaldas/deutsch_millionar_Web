import { expect, test } from '@playwright/test';
import { abrir, comenzar, responder } from './ayudas';
import { revisarMaquetacion } from './maquetacion';
import { ES_ALEMAN } from './temario';

// Usa el tema «der / die / das» del temario alemán.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

const bloquePlural = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: 'Singular y plural' });

test.describe('el plural en der / die / das', () => {
  test('no se muestra durante la pregunta (delataría el artículo) y sí en el resultado', async ({
    page,
  }) => {
    await abrir(page, { reloj: true, temas: ['der_die_das'] });
    await comenzar(page);
    await expect(bloquePlural(page)).toHaveCount(0);
    await responder(page, true, true);

    await expect(bloquePlural(page)).toBeVisible();
    await expect(bloquePlural(page).getByText(/plural · mehrzahl/i)).toBeVisible();
    // Singular con su artículo y plural siempre con «die».
    await expect(bloquePlural(page).locator('.forma').first()).toContainText(
      /^Singular\s*(der|die|das) \S+/,
    );
    await expect(bloquePlural(page).locator('.forma.destacada')).toContainText(/Plural\s*die \S+/);
    await expect(bloquePlural(page).getByText('En plural el artículo siempre es')).toBeVisible();
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
