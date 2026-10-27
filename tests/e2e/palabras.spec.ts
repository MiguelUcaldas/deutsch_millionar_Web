import { expect, test, type Locator, type Page } from '@playwright/test';
import { abrir } from './ayudas';
import { ES_ALEMAN } from './temario';

// Usa los nombres de los temas del alemán.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

const NOMBRES = ['Preposiciones de tiempo', 'Adverbios de frecuencia', 'der / die / das'];
/**
 * Los tres anchos pedidos y los anchos donde, con `overflow-wrap: anywhere` y casillas de 230 px,
 * «Preposiciones» se partía a mitad de palabra (540-570, 800-820 y 1040-1070 px).
 */
const ANCHOS = [360, 540, 560, 768, 810, 1050, 1060, 1280];

/** Las palabras de un texto que quedaron repartidas en más de una línea. */
function palabrasPartidas(elemento: Locator): Promise<string[]> {
  return elemento.evaluate((el) => {
    const nodo = el.firstChild as Text;
    const partidas: string[] = [];
    for (const palabra of nodo.textContent!.matchAll(/\S+/g)) {
      const rango = document.createRange();
      rango.setStart(nodo, palabra.index!);
      rango.setEnd(nodo, palabra.index! + palabra[0].length);
      const lineas = new Set([...rango.getClientRects()].map((r) => Math.round(r.top)));
      if (lineas.size > 1) partidas.push(palabra[0]);
    }
    return partidas;
  });
}

const todosLosNombres = (page: Page) => page.locator('label.casilla .nombre');

for (const ancho of ANCHOS) {
  test.describe(`corte de palabras · ${ancho}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 800 });
      await abrir(page, { reloj: true });
    });

    test('en Inicio los nombres de los temas bajan de línea por palabras', async ({ page }) => {
      for (const nombre of NOMBRES) {
        const elemento = page.locator('label.casilla .nombre', { hasText: nombre });
        await expect(elemento).toHaveCount(1);
        expect(await palabrasPartidas(elemento), nombre).toEqual([]);
      }
    });

    test('en Repaso los nombres de los temas bajan de línea por palabras', async ({ page }) => {
      await page.getByRole('button', { name: 'Repaso' }).click();
      for (const nombre of NOMBRES) {
        const elemento = page.locator('button.tema b', { hasText: nombre });
        await expect(elemento).toHaveCount(1);
        expect(await palabrasPartidas(elemento), nombre).toEqual([]);
      }
    });
  });
}

test('ningún nombre de tema se parte a mitad de palabra en ningún ancho de 320 a 1500 px', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await abrir(page, { reloj: true });
  const partidas: string[] = [];
  for (let ancho = 320; ancho <= 1500; ancho += 10) {
    await page.setViewportSize({ width: ancho, height: 800 });
    const nombres = await todosLosNombres(page).all();
    for (const nombre of nombres) {
      for (const palabra of await palabrasPartidas(nombre)) partidas.push(`${ancho}px: ${palabra}`);
    }
  }
  expect(partidas).toEqual([]);
});
