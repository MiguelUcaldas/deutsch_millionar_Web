import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { abrir, comenzar, jugarCorrectas, responder, siguiente } from './ayudas';
import { ES_ALEMAN } from './temario';

// Estas pruebas usan el contenido del temario alemán.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

// Las capturas dependen del sistema operativo (tipografía y suavizado): si no hay referencias
// para esta plataforma, estas pruebas se omiten en vez de fallar. Se generan con --update-snapshots.
test.skip(
  !existsSync(path.resolve(import.meta.dirname, 'capturas', process.platform)),
  'Sin capturas de referencia para esta plataforma',
);

// Capturas de referencia: detectan cambios visuales no deseados en cada pantalla.
// Para aceptar un cambio intencional: npx playwright test capturas --update-snapshots

/** Juega respuestas correctas hasta que el resultado cumpla la condición (máximo 15). */
async function hastaResultadoCon(page: Page, condicion: (p: Page) => Promise<boolean>) {
  for (let i = 1; i <= 15; i++) {
    await responder(page, true, true);
    await page.clock.runFor(1500); // la flecha de la tabla termina de dibujarse
    if (await condicion(page)) return;
    await siguiente(page);
    await page.locator('[data-opcion]').first().waitFor();
  }
  throw new Error('No apareció un resultado con la ficha buscada');
}

for (const apariencia of ['oscuro', 'claro'] as const) {
  for (const [nombreAncho, ancho, alto] of [
    ['escritorio', 1280, 900],
    ['celular', 390, 844],
  ] as const) {
    test(`capturas ${nombreAncho} · ${apariencia}`, async ({ page }) => {
      test.setTimeout(120_000);
      const foto = (nombre: string) =>
        expect(page).toHaveScreenshot(`${nombreAncho}-${apariencia}-${nombre}.png`, {
          fullPage: true,
        });
      await page.setViewportSize({ width: ancho, height: alto });
      await abrir(page, { reloj: true, apariencia, semilla: 3 });

      await foto('inicio');
      await page.getByRole('button', { name: 'Repaso' }).click();
      await foto('repaso');
      await page.getByRole('button', { name: /Conjugación/ }).click();
      await foto('modal-tema');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Volver' }).click();

      await comenzar(page);
      await foto('pregunta');
      await page.getByRole('button', { name: '50:50' }).click();
      await page.getByRole('button', { name: 'Público' }).click();
      await page.clock.runFor(2500);
      await foto('pregunta-comodines');
      if (ancho < 900) {
        await page.getByRole('button', { name: 'Escalera' }).click();
        await foto('escalera-hoja');
        await page.keyboard.press('Escape');
      }
      await page.locator('[data-opcion]:not([disabled])').first().click();
      await page.clock.runFor(1000);
      await foto('pregunta-suspenso');
      await page.clock.runFor(2000);
      await foto('resultado');
      await siguiente(page);
      await foto('derrota');

      await page.getByRole('button', { name: 'Nueva partida' }).click();
      await page.getByRole('button', { name: 'Ninguno' }).click();
      await page.getByLabel(/Acusativo/).check();
      await page.getByLabel(/Nominativo/).check();
      await comenzar(page);
      await hastaResultadoCon(page, async (p) => (await p.locator('svg.flecha').count()) > 0);
      await foto('resultado-tabla-flecha');

      await page.goto('/?semilla=3&error');
      await page.getByRole('heading', { name: 'Error al cargar los datos' }).waitFor();
      await foto('error');
    });
  }
}

for (const apariencia of ['oscuro', 'claro'] as const) {
  test(`capturas de fichas especiales · ${apariencia}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await abrir(page, { reloj: true, apariencia, semilla: 5, temas: ['conjugacion', 'hora'] });
    await comenzar(page);
    await hastaResultadoCon(page, async (p) => (await p.getByText('Präsens').count()) > 0);
    await expect(page).toHaveScreenshot(`resultado-conjugacion-${apariencia}.png`, {
      fullPage: true,
    });
  });

  test(`capturas de la victoria · ${apariencia}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await abrir(page, { reloj: true, apariencia, semilla: 9 });
    await comenzar(page);
    await jugarCorrectas(page, 15);
    await siguiente(page);
    await page.getByText('Millionär', { exact: false }).first().waitFor();
    await expect(page).toHaveScreenshot(`victoria-${apariencia}.png`, { fullPage: true });
  });
}
