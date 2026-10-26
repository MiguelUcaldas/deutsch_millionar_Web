import { expect, test } from '@playwright/test';
import { revisarMaquetacion } from './maquetacion';

// Prueba de humo que sirve para cualquier temario: carga, se juega una partida completa y
// ninguna pantalla se desborda. Es la que protege a los repositorios creados desde la plantilla.

test('el temario carga, se juega una partida completa y las pantallas caben', async ({ page }) => {
  test.setTimeout(120_000);
  const errores: string[] = [];
  page.on('pageerror', (error) => errores.push(error.message));

  await page.route(/fonts\.(googleapis|gstatic)\.com/, (ruta) => ruta.abort());
  await page.clock.install({ time: 0 });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/?semilla=1');
  await page.getByRole('heading', { level: 1 }).waitFor();
  expect(await revisarMaquetacion(page, 'inicio')).toEqual([]);

  await page.locator('button.boton--principal').click();
  await page.locator('[data-opcion]').first().waitFor();
  expect(await revisarMaquetacion(page, 'pregunta')).toEqual([]);

  let preguntas = 0;
  while (await page.locator('[data-correcta="true"]').count()) {
    await page.locator('[data-correcta="true"]').click();
    await page.clock.runFor(3000);
    const siguiente = page.getByRole('button', { name: /Enter/ });
    await siguiente.waitFor();
    if (preguntas === 0) expect(await revisarMaquetacion(page, 'resultado')).toEqual([]);
    await siguiente.click();
    preguntas++;
  }

  expect(preguntas).toBeGreaterThan(0);
  // La partida termina en la pantalla de victoria, con un premio visible.
  await expect(page.locator('.premio')).toBeVisible();
  expect(await revisarMaquetacion(page, 'victoria')).toEqual([]);
  expect(errores).toEqual([]);
});
