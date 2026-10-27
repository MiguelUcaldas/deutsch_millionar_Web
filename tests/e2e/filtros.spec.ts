import { expect, test, type Page } from '@playwright/test';
import { abrir } from './ayudas';
import { ES_ALEMAN } from './temario';

// Usa los niveles del temario alemán: diez temas A1 y «Conectores» en A2.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

const filaSeleccion = (page: Page) => page.getByRole('group', { name: 'Seleccionar:' });
const accion = (page: Page, nombre: 'Todos' | 'Ninguno') =>
  filaSeleccion(page).getByRole('button', { name: nombre, exact: true });
const nivel = (page: Page, valor: string) =>
  page.getByRole('group', { name: 'Nivel' }).getByRole('button', { name: valor, exact: true });
const casillas = (page: Page) => page.locator('label.casilla');
const casilla = (page: Page, nombre: string) =>
  page.locator('label.casilla', { hasText: nombre }).getByRole('checkbox');
const disponibles = (page: Page) => page.locator('.cifra');

test.describe('selección rápida por nivel', () => {
  test('una sola fila: Seleccionar con Todos y Ninguno, y las fichas de nivel que existen', async ({
    page,
  }) => {
    await abrir(page);
    await expect(filaSeleccion(page)).toBeVisible();
    await expect(accion(page, 'Todos')).toBeVisible();
    await expect(accion(page, 'Ninguno')).toBeVisible();
    await expect(nivel(page, 'A1')).toBeVisible();
    await expect(nivel(page, 'A2')).toBeVisible();
    // Solo hay fichas de los niveles que tienen temas, y ninguna ficha «Todos» dentro de Nivel.
    await expect(nivel(page, 'B1')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Nivel' }).getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Todos', exact: true })).toHaveCount(1);
    // Cada tema lleva su nivel en una píldora.
    await expect(
      page.locator('label.casilla', { hasText: 'Conectores' }).getByText('A2'),
    ).toBeVisible();
    await expect(
      page.locator('label.casilla', { hasText: 'Acusativo' }).getByText('A1'),
    ).toBeVisible();
  });

  test('con todo marcado las dos fichas están activas y se ven todos los temas', async ({
    page,
  }) => {
    await abrir(page);
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'true');
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
    await expect(casillas(page)).toHaveCount(11);
    await expect(page.getByText('11 de 11 elegidos')).toBeVisible();
  });

  test('pulsar A2 desmarca solo su tema y otra vez A2 lo vuelve a marcar; los temas no se ocultan', async ({
    page,
  }) => {
    await abrir(page);
    await nivel(page, 'A2').click();
    await expect(casilla(page, 'Conectores')).not.toBeChecked();
    await expect(casilla(page, 'Acusativo')).toBeChecked();
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'false');
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'true');
    await expect(casillas(page)).toHaveCount(11);
    await expect(page.getByText('10 de 11 elegidos')).toBeVisible();
    await expect(disponibles(page)).toHaveText('178');
    // No hay aviso de temas «fuera por el filtro»: ya no existe el filtrado.
    await expect(page.getByText('quedan fuera por el filtro')).toHaveCount(0);

    await nivel(page, 'A2').click();
    await expect(casilla(page, 'Conectores')).toBeChecked();
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('11 de 11 elegidos')).toBeVisible();
    await expect(disponibles(page)).toHaveText('190');
  });

  test('desmarcar una casilla a mano deja la ficha mixta; pulsarla marca todos y luego los desmarca', async ({
    page,
  }) => {
    await abrir(page);
    await casilla(page, 'Acusativo').uncheck();
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'mixed');
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'true');

    // Con alguno sin marcar, la ficha marca todos los de su nivel.
    await nivel(page, 'A1').click();
    await expect(casilla(page, 'Acusativo')).toBeChecked();
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('11 de 11 elegidos')).toBeVisible();

    // Con todos marcados, la ficha los desmarca (y deja el nivel A2 como estaba).
    await nivel(page, 'A1').click();
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'false');
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('1 de 11 elegidos')).toBeVisible();
    await expect(casilla(page, 'Conectores')).toBeChecked();
  });

  test('las fichas se actualizan solas al marcar y desmarcar casillas', async ({ page }) => {
    await abrir(page);
    await casilla(page, 'Conectores').uncheck();
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'false');
    await casilla(page, 'Conectores').check();
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
  });

  test('el conteo de preguntas y el mínimo de 16 se actualizan con las fichas', async ({
    page,
  }) => {
    await abrir(page);
    await nivel(page, 'A1').click();
    // Solo queda Conectores: 12 preguntas, por debajo del mínimo.
    await expect(disponibles(page)).toHaveText('12');
    await expect(page.getByText('Selecciona más temas: hay 12 preguntas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeDisabled();
    await nivel(page, 'A1').click();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeEnabled();
  });

  test('Todos y Ninguno actúan sobre todos los temas y las fichas lo reflejan', async ({
    page,
  }) => {
    await abrir(page);
    await accion(page, 'Ninguno').click();
    await expect(page.getByText('0 de 11 elegidos')).toBeVisible();
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'false');
    await expect(nivel(page, 'A2')).toHaveAttribute('aria-pressed', 'false');
    await accion(page, 'Todos').click();
    await expect(page.getByText('11 de 11 elegidos')).toBeVisible();
    await expect(nivel(page, 'A1')).toHaveAttribute('aria-pressed', 'true');
  });

  test('la selección se recuerda; no se guarda ningún filtro aparte y se borra el antiguo', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        // Lo que dejaba la versión anterior.
        localStorage.setItem('millonario:aleman:filtros', JSON.stringify({ nivel: ['A2'] }));
      } catch {
        /* sin almacenamiento */
      }
    });
    await abrir(page);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('millonario:aleman:filtros')))
      .toBeNull();
    await nivel(page, 'A2').click();
    await expect(page.getByText('10 de 11 elegidos')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('millonario:aleman:filtros'))).toBeNull();
    expect(
      await page.evaluate(() => localStorage.getItem('millonario:aleman:temas')),
    ).not.toContain('conectores');
  });

  test('Repaso muestra todos los temas con su nivel y sin fichas de selección', async ({
    page,
  }) => {
    await abrir(page);
    await nivel(page, 'A2').click();
    await page.getByRole('button', { name: 'Repaso' }).click();
    await expect(page.locator('button.tema')).toHaveCount(11);
    await expect(
      page.locator('button.tema', { hasText: 'Conectores' }).getByText('A2'),
    ).toBeVisible();
    await expect(page.getByRole('group', { name: 'Nivel' })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Seleccionar:' })).toHaveCount(0);
  });

  test('una partida con A2 desmarcado no incluye el tema de A2', async ({ page }) => {
    await abrir(page);
    await nivel(page, 'A2').click();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await page.locator('[data-opcion]').first().waitFor();
    await expect(page.locator('.chip.tema')).not.toHaveText('Conectores');
  });
});
