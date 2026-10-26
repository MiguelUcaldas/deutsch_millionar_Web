import { expect, test } from '@playwright/test';
import { abrir, comenzar, responder, siguiente } from './ayudas';
import { revisarMaquetacion } from './maquetacion';
import { ES_ALEMAN } from './temario';

test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

test.describe('modo práctica', () => {
  test('se practica un tema sin tiempo, dinero ni comodines y se ve el resumen', async ({
    page,
  }) => {
    await abrir(page, { reloj: true });
    await page.getByRole('button', { name: 'Repaso' }).click();
    await page.getByRole('button', { name: /Conectores/ }).click();
    await page.getByRole('button', { name: 'Practicar este tema' }).click();

    await expect(page.getByText('Práctica · Conectores')).toBeVisible();
    await expect(page.getByText('Pregunta 1 de 12')).toBeVisible();
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    await expect(page.locator('.premio')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '50:50' })).toHaveCount(0);
    await expect(page.getByLabel('Escalera de premios')).toHaveCount(0);

    // Pasa mucho más tiempo del que dura una pregunta normal y no pierde.
    await page.clock.runFor(120_000);
    await expect(page.locator('[data-opcion]').first()).toBeVisible();

    // Acierta una y falla la siguiente: la práctica continúa.
    await page.locator('[data-correcta="true"]').click();
    await page.clock.runFor(1500);
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible();
    await expect(page.locator('.chip.numeros')).toHaveText('Pregunta 1 de 12');
    expect(await revisarMaquetacion(page, 'práctica: resultado')).toEqual([]);
    await siguiente(page);
    await page.locator('[data-opcion]:not([data-correcta="true"])').first().click();
    await page.clock.runFor(1500);
    await expect(page.getByRole('heading', { name: 'Falsch!' })).toBeVisible();
    await siguiente(page);
    await expect(page.getByText('Pregunta 3 de 12')).toBeVisible();

    await page.getByRole('button', { name: 'Terminar' }).click();
    await expect(page.getByRole('heading', { name: 'Práctica terminada' })).toBeVisible();
    await expect(page.getByText('1 de 2 correctas')).toBeVisible();
    expect(await revisarMaquetacion(page, 'práctica: fin')).toEqual([]);

    await page.getByRole('button', { name: 'Practicar de nuevo' }).click();
    await expect(page.getByText('Pregunta 1 de 12')).toBeVisible();
    await page.getByRole('button', { name: 'Terminar' }).click();
    await page.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(page.getByRole('heading', { name: 'DEUTSCH MILLIONÄR' })).toBeVisible();
  });

  test('«Practicar este tema» solo aparece desde el repaso, no durante una partida', async ({
    page,
  }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, true, true);
    await page.getByRole('button', { name: /^¿Qué es «/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Practicar este tema' })).toHaveCount(0);
  });

  test('la práctica se ve bien en celular', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await abrir(page, { reloj: true });
    await page.getByRole('button', { name: 'Repaso' }).click();
    await page.getByRole('button', { name: /Preposiciones/ }).click();
    expect(await revisarMaquetacion(page, 'repaso: modal con practicar')).toEqual([]);
    await page.getByRole('button', { name: 'Practicar este tema' }).click();
    expect(await revisarMaquetacion(page, 'práctica: pregunta')).toEqual([]);
  });
});

test.describe('progreso y repaso espaciado', () => {
  test('tras fallar se ve el progreso y se puede repasar lo fallado', async ({ page }) => {
    await abrir(page, { reloj: true });
    await expect(page.getByText('Juega unas partidas y aquí verás tu progreso.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Repasar lo fallado' })).toHaveCount(0);

    await comenzar(page);
    await responder(page, true, true);
    await siguiente(page);
    await page.locator('[data-opcion]').first().waitFor();
    await responder(page, false, true);
    await siguiente(page);
    await page.getByRole('button', { name: 'Nueva partida' }).click();

    const tarjeta = page.getByRole('region', { name: 'Tu progreso' });
    await expect(tarjeta.getByText('1 de 15 preguntas')).toBeVisible();
    await expect(tarjeta.getByText('Partidas jugadas')).toBeVisible();
    await expect(tarjeta.getByText('1 por repasar')).toBeVisible();
    expect(await revisarMaquetacion(page, 'inicio con progreso')).toEqual([]);

    // Se recuerda al recargar.
    await page.reload();
    await expect(page.getByText('1 por repasar')).toBeVisible();

    await page.getByRole('button', { name: 'Repasar lo fallado' }).click();
    await expect(page.getByText('Práctica · Repaso de lo fallado')).toBeVisible();
    await expect(page.getByText('Pregunta 1 de 1')).toBeVisible();
    await page.locator('[data-correcta="true"]').click();
    await expect(page.getByRole('heading', { name: 'Richtig!' })).toBeVisible({ timeout: 4000 });
    await siguiente(page);
    await page.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(page.getByText('Nada pendiente por ahora')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Repasar lo fallado' })).toBeDisabled();
  });

  test('se puede borrar el progreso', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, false, true);
    await siguiente(page);
    await page.getByRole('button', { name: 'Nueva partida' }).click();
    page.once('dialog', (dialogo) => dialogo.accept());
    await page.getByRole('button', { name: 'Borrar progreso' }).click();
    await expect(page.getByText('Juega unas partidas y aquí verás tu progreso.')).toBeVisible();
  });

  test('el progreso de otro temario no se mezcla (prefijo en localStorage)', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, false, true);
    const claves = await page.evaluate(() => Object.keys(localStorage));
    expect(claves).toContain('millonario:aleman:progreso');
    expect(claves.every((c) => c.startsWith('millonario:aleman:'))).toBe(true);
  });
});

test.describe('pronunciación', () => {
  test('sin voces del idioma no hay botón de escuchar', async ({ page }) => {
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, true, true);
    await expect(page.getByRole('button', { name: 'Escuchar la oración' })).toHaveCount(0);
  });

  test('con una voz alemana el botón lee la oración completa', async ({ page }) => {
    await page.addInitScript(() => {
      const dichos: { texto: string; lang: string }[] = [];
      (window as unknown as { __dichos: typeof dichos }).__dichos = dichos;
      class Emision {
        lang = '';
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      }
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Emision });
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          getVoices: () => [{ lang: 'de-DE' }],
          addEventListener: () => {},
          removeEventListener: () => {},
          cancel: () => {},
          speak: (e: InstanceType<typeof Emision>) => dichos.push({ texto: e.text, lang: e.lang }),
        },
      });
    });
    await abrir(page, { reloj: true });
    await comenzar(page);
    await responder(page, true, true);
    const oracion = (await page.locator('p.oracion').textContent())!.replace(/\s+/g, ' ').trim();
    await page.getByRole('button', { name: 'Escuchar la oración' }).click();
    const dichos = await page.evaluate(
      () => (window as unknown as { __dichos: { texto: string; lang: string }[] }).__dichos,
    );
    expect(dichos).toHaveLength(1);
    expect(dichos[0]!.lang).toBe('de-DE');
    expect(dichos[0]!.texto.replace(/\s+/g, ' ').trim()).toBe(oracion);
    expect(await revisarMaquetacion(page, 'resultado con voz')).toEqual([]);
  });
});
