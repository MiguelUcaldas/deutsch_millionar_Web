import { expect, test, type Page } from '@playwright/test';
import { abrir } from './ayudas';
import { ES_ALEMAN } from './temario';

// Usa los niveles del temario alemán: diez temas A1 y «Conectores» en A2.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

const grupoNivel = (page: Page) => page.getByRole('group', { name: 'Nivel' });
const ficha = (page: Page, nombre: string) =>
  grupoNivel(page).getByRole('button', { name: nombre, exact: true });
const casillas = (page: Page) => page.locator('label.casilla');

test.describe('filtros de temas', () => {
  test('Inicio muestra las fichas de nivel solo con los valores que tienen temas', async ({
    page,
  }) => {
    await abrir(page);
    await expect(grupoNivel(page)).toBeVisible();
    await expect(ficha(page, 'Todos')).toHaveAttribute('aria-pressed', 'true');
    await expect(ficha(page, 'A1')).toHaveAttribute('aria-pressed', 'false');
    await expect(ficha(page, 'A2')).toBeVisible();
    await expect(ficha(page, 'B1')).toHaveCount(0);
    // Cada tema lleva su nivel en una píldora.
    await expect(
      page.locator('label.casilla', { hasText: 'Conectores' }).getByText('A2'),
    ).toBeVisible();
    await expect(
      page.locator('label.casilla', { hasText: 'Acusativo' }).getByText('A1'),
    ).toBeVisible();
  });

  test('filtrar oculta temas sin desmarcarlos y avisa de los que quedan fuera', async ({
    page,
  }) => {
    await abrir(page);
    await ficha(page, 'A2').click();
    await expect(ficha(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
    await expect(casillas(page)).toHaveCount(1);
    await expect(casillas(page).first()).toContainText('Conectores');
    await expect(page.getByText('1 de 1 elegidos')).toBeVisible();
    await expect(page.getByText('10 temas marcados quedan fuera por el filtro')).toBeVisible();
    // Solo cuentan los visibles: 12 preguntas, por debajo del mínimo de 16.
    await expect(page.getByText('Selecciona más temas: hay 12 preguntas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeDisabled();

    // Quitar el filtro devuelve todo tal como estaba marcado.
    await ficha(page, 'Todos').click();
    await expect(casillas(page)).toHaveCount(11);
    await expect(page.getByText('11 de 11 elegidos')).toBeVisible();
    await expect(page.getByText('quedan fuera por el filtro')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeEnabled();
  });

  test('se pueden sumar valores y «Ninguno» solo desmarca los visibles', async ({ page }) => {
    await abrir(page);
    await ficha(page, 'A2').click();
    await page.getByRole('button', { name: 'Ninguno' }).click();
    await expect(page.getByText('0 de 1 elegidos')).toBeVisible();
    await ficha(page, 'A1').click();
    await expect(casillas(page)).toHaveCount(11);
    // Los diez temas A1 siguen marcados; solo «Conectores» se desmarcó.
    await expect(page.getByText('10 de 11 elegidos')).toBeVisible();
  });

  test('el filtro se recuerda al recargar', async ({ page }) => {
    await abrir(page);
    await ficha(page, 'A2').click();
    await page.reload();
    await page.getByRole('heading', { level: 1 }).waitFor();
    await expect(ficha(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
    await expect(casillas(page)).toHaveCount(1);
  });

  test('Repaso tiene las mismas fichas y el nivel en cada tema', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Repaso' }).click();
    await expect(grupoNivel(page)).toBeVisible();
    await expect(page.locator('button.tema')).toHaveCount(11);
    await expect(
      page.locator('button.tema', { hasText: 'Conectores' }).getByText('A2'),
    ).toBeVisible();
    await ficha(page, 'A2').click();
    await expect(page.locator('button.tema')).toHaveCount(1);
    await page.getByRole('button', { name: 'Volver' }).click();
    // El filtro es el mismo en Inicio.
    await expect(ficha(page, 'A2')).toHaveAttribute('aria-pressed', 'true');
  });

  test('una partida con el filtro A1 no incluye el tema de A2', async ({ page }) => {
    await abrir(page);
    await ficha(page, 'A1').click();
    await expect(page.getByText('10 de 10 elegidos')).toBeVisible();
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await page.locator('[data-opcion]').first().waitFor();
    await expect(page.locator('.chip.tema')).not.toHaveText('Conectores');
  });
});
