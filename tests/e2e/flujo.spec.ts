import { expect, test } from '@playwright/test';
import {
  SUSPENSO_MS,
  abrir,
  avanzar,
  comenzar,
  jugarCorrectas,
  opcionCorrecta,
  opcionIncorrecta,
  responder,
  siguiente,
} from './ayudas';
import { ES_ALEMAN } from './temario';

// Estas pruebas usan el contenido del temario alemán.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

test.describe('flujo de la partida', () => {
  test('inicio: 190 preguntas, 11 temas elegidos y reglas del temario', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('heading', { name: 'DEUTSCH MILLIONÄR' })).toBeVisible();
    await expect(page.getByText('190', { exact: true })).toBeVisible();
    await expect(page.getByText('11 de 11 elegidos')).toBeVisible();
    await expect(page.getByText('Responde 15 preguntas de alemán')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeEnabled();
  });

  test('una pregunta con reloj real: suspenso, revelación y resultado', async ({ page }) => {
    await abrir(page);
    await comenzar(page);
    await expect(page.getByText('Pregunta 1 de 15')).toBeVisible();
    await opcionCorrecta(page).click();
    await expect(page.locator('.suspenso')).toHaveCount(1);
    await expect(page.locator('.correcta')).toHaveCount(1, { timeout: 4000 });
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible({ timeout: 4000 });
    await expect(page.getByText('¡Correcto!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeFocused();
  });

  test('15 respuestas correctas llevan a la victoria con € 1.000.000', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await jugarCorrectas(page, 15);
    await siguiente(page);
    await expect(page.getByText('Herzlichen Glückwunsch! Du bist Millionär!')).toBeVisible();
    await expect(page.getByText('€ 1.000.000')).toBeVisible();
    await page.getByRole('button', { name: 'Nueva partida' }).click();
    await expect(page.getByRole('heading', { name: 'DEUTSCH MILLIONÄR' })).toBeVisible();
  });

  test('derrota por respuesta incorrecta: muestra la correcta y el premio asegurado', async ({
    page,
  }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await jugarCorrectas(page, 6);
    await siguiente(page);
    await page.locator('[data-opcion]').first().waitFor();
    const correcta = (await opcionCorrecta(page).locator('.texto').textContent())!.trim();
    await responder(page, false, true);
    await expect(page.getByRole('heading', { name: 'Falsch!' })).toBeVisible();
    await expect(page.getByText(/Tu respuesta: .* ✗/)).toBeVisible();
    await siguiente(page);
    await expect(page.getByRole('heading', { name: 'Game Over' })).toBeVisible();
    await expect(page.getByText('Respondiste de forma incorrecta.')).toBeVisible();
    await expect(page.locator('.correcta-era strong')).toHaveText(correcta);
    await expect(page.getByText('Llegaste hasta la pregunta')).toBeVisible();
    // Cinco preguntas superadas incluyen la segura 5: € 1.000.
    await expect(page.locator('.premio')).toHaveText('€ 1.000');
  });

  test('derrota por tiempo: avisa en el resultado y en la pantalla final', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await expect(page.locator('[role="timer"]')).toContainText('30');
    await avanzar(page, 26_000);
    await expect(page.locator('[role="timer"]')).toContainText('4');
    await expect(page.locator('[role="timer"]')).toHaveAttribute('aria-live', 'polite');
    await avanzar(page, 5000);
    await expect(page.getByRole('heading', { name: 'Falsch!' })).toBeVisible();
    await expect(page.getByText('Se acabó el tiempo')).toBeVisible();
    await siguiente(page);
    await expect(page.getByText('Zeit ist um! / ¡Tiempo agotado!')).toBeVisible();
    await expect(page.locator('.premio')).toHaveText('€ 0');
  });

  test('el contador pasa a rojo con 5 s o menos y la barra se vacía', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await expect(page.locator('.contador.alerta')).toHaveCount(0);
    await avanzar(page, 25_500);
    await expect(page.locator('.contador.alerta')).toHaveCount(1);
    await expect(page.locator('[role="timer"]')).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('comodines', () => {
  test('50:50 elimina dos opciones y las teclas de las eliminadas se ignoran', async ({ page }) => {
    await abrir(page);
    await comenzar(page);
    await page.getByRole('button', { name: '50:50' }).click();
    await expect(page.locator('.eliminada')).toHaveCount(2);
    await expect(page.getByRole('button', { name: '50:50 · usado' })).toBeDisabled();
    const letrasEliminadas = await page
      .locator('.eliminada')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.opcion!));
    for (const letra of letrasEliminadas) await page.keyboard.press(letra.toLowerCase());
    await expect(page.locator('.suspenso')).toHaveCount(0);
    await expect(page.getByText('Pregunta 1 de 15')).toBeVisible();
    // La correcta nunca se elimina.
    await expect(opcionCorrecta(page)).not.toHaveClass(/eliminada/);
  });

  test('Público pausa el tiempo, muestra barras que suman 100 y reanuda', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await avanzar(page, 3000);
    const antes = await page.locator('[role="timer"] .numero').textContent();
    await page.getByRole('button', { name: 'Público' }).click();
    await expect(page.getByText('Tiempo en pausa')).toBeVisible();
    await avanzar(page, 1500);
    expect(await page.locator('[role="timer"] .numero').textContent()).toBe(antes);
    await avanzar(page, 700);
    await expect(page.getByText('Tiempo en pausa')).toHaveCount(0);
    const valores = await page.locator('.valor').allTextContents();
    expect(valores).toHaveLength(4);
    expect(valores.reduce((suma, v) => suma + parseInt(v), 0)).toBe(100);
    await expect(page.getByRole('button', { name: 'Público · usado' })).toBeDisabled();
    await avanzar(page, 3000);
    expect(Number(await page.locator('[role="timer"] .numero').textContent())).toBeLessThan(
      Number(antes),
    );
  });

  test('Cambiar sustituye la pregunta y reinicia el tiempo', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    const enunciado = await page.locator('h2').first().textContent();
    await avanzar(page, 12_000);
    await page.getByRole('button', { name: 'Cambiar' }).click();
    await expect(page.locator('[role="timer"]')).toContainText('30');
    expect(await page.locator('h2').first().textContent()).not.toBe(enunciado);
    await expect(page.getByRole('button', { name: 'Cambiar · usado' })).toBeDisabled();
  });

  test('los comodines no se pueden usar durante el suspenso', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await opcionIncorrecta(page).click();
    await expect(page.getByRole('button', { name: '50:50' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Público' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cambiar' })).toBeDisabled();
  });
});

test.describe('teclado', () => {
  test('A-D responden y Enter pasa a la siguiente pregunta', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    const letra = await opcionCorrecta(page).getAttribute('data-opcion');
    await page.keyboard.press(letra!.toLowerCase());
    await avanzar(page, SUSPENSO_MS + 1100);
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Pregunta 2 de 15')).toBeVisible();
  });

  test('las teclas se ignoran mientras hay un modal abierto', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responderYAbrirTema(page);
    await page.keyboard.press('a');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Seguimos en el resultado: el teclado no avanzó la partida por debajo del modal.
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible();
  });
});

async function responderYAbrirTema(page: import('@playwright/test').Page) {
  await responder(page, true, true);
  await page.getByRole('button', { name: /^¿Qué es «/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('modal de tema', () => {
  test('abre desde el resultado, el foco entra y vuelve al botón al cerrar', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, true, true);
    const boton = page.getByRole('button', { name: /^¿Qué es «/ });
    await boton.click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Cerrar' }).first()).toBeFocused();
    await expect(dialogo.getByRole('heading', { name: '¿Qué es?' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogo).toHaveCount(0);
    await expect(boton).toBeFocused();
  });

  test('un clic en el velo lo cierra', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Repaso' }).click();
    await page.getByRole('button', { name: /Artículos/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('repaso y selección de temas', () => {
  test('el repaso lista los 11 temas y vuelve al inicio', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Repaso' }).click();
    await expect(page.getByRole('heading', { name: 'Repaso de temas' })).toBeVisible();
    await expect(
      page.getByText('Elige un tema para ver su explicación, sin tiempo ni preguntas.'),
    ).toBeVisible();
    await expect(page.locator('.rejilla button')).toHaveCount(11);
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('heading', { name: 'DEUTSCH MILLIONÄR' })).toBeVisible();
  });

  test('un solo tema pequeño no alcanza el mínimo y deshabilita Comenzar', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Ninguno' }).click();
    await page.getByLabel(/Acusativo/).check();
    await expect(page.getByRole('alert')).toContainText(
      'hay 12 preguntas y se necesitan al menos 16',
    );
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeDisabled();
    await page.getByLabel(/Nominativo/).check();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeEnabled();
  });

  test('la selección de temas se recuerda al recargar', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Ninguno' }).click();
    await page.getByLabel(/Conectores/).check();
    await page.getByLabel(/Números/).check();
    await page.reload();
    await expect(page.getByText('2 de 11 elegidos')).toBeVisible();
    await expect(page.getByLabel(/Conectores/)).toBeChecked();
    await expect(page.getByLabel(/Acusativo/)).not.toBeChecked();
  });

  test('una partida solo usa los temas elegidos', async ({ page }) => {
    await abrir(page, { temas: ['hora', 'conectores'] });
    await comenzar(page);
    for (let i = 0; i < 4; i++) {
      const tema = (await page.locator('.chip.tema').textContent())!.trim();
      expect(['La hora', 'Conectores']).toContain(tema);
      await responder(page, true);
      await siguiente(page);
      await page.locator('[data-opcion]').first().waitFor();
    }
  });
});

test.describe('apariencia y modos', () => {
  test('el tema oscuro es el predeterminado y el botón alterna y se recuerda', async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ colorScheme: 'dark' });
    const page = await contexto.newPage();
    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oscuro');
    await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
    await contexto.close();
  });

  test('sin preferencia guardada se respeta prefers-color-scheme', async ({ browser }) => {
    const contexto = await browser.newContext({ colorScheme: 'light' });
    const page = await contexto.newPage();
    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
    await contexto.close();
  });

  test('con ?debug aparece el registro de eventos', async ({ page }) => {
    await abrir(page, { consulta: '&debug' });
    await comenzar(page);
    await expect(page.getByText(/Registro de eventos/)).toBeVisible();
    await expect(page.getByText(/comenzar: inicio → pregunta/)).toBeVisible();
  });

  test('sin ?debug no hay registro', async ({ page }) => {
    await abrir(page);
    await expect(page.getByText(/Registro de eventos/)).toHaveCount(0);
  });

  test('la pantalla de error de datos muestra archivo, línea y reintentar', async ({ page }) => {
    await abrir(page, { consulta: '&error' });
    await expect(page.getByRole('heading', { name: 'Error al cargar los datos' })).toBeVisible();
    await expect(page.getByText('temas/acusativo/preguntas.json')).toBeVisible();
    await expect(page.getByText('Línea 48, columna 7')).toBeVisible();
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByRole('heading', { name: 'DEUTSCH MILLIONÄR' })).toBeVisible();
  });

  test('con movimiento reducido no hay animaciones y el suspenso sigue siendo una pausa', async ({
    browser,
  }) => {
    const contexto = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await contexto.newPage();
    await abrir(page, { reloj: true });
    await comenzar(page);
    await opcionCorrecta(page).click();
    const animacion = await page
      .locator('.suspenso')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animacion).toBe('none');
    await expect(page.locator('.suspenso')).toHaveCount(1);
    await avanzar(page, SUSPENSO_MS + 1100);
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible();
    await contexto.close();
  });

  test('el hueco del enunciado se rellena con la respuesta al revelar', async ({ page }) => {
    await abrir(page, { reloj: true, temas: ['acusativo', 'nominativo'] });
    await comenzar(page);
    await expect(page.locator('.hueco').first()).toHaveText('');
    const correcta = (await opcionCorrecta(page).locator('.texto').textContent())!.trim();
    await opcionCorrecta(page).click();
    await avanzar(page, 2000);
    await expect(page.locator('.hueco.revelado').first()).toHaveText(correcta);
  });
});
