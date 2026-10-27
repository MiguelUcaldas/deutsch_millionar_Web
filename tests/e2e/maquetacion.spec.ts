import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  ANCHOS,
  APARIENCIAS,
  abrir,
  comenzar,
  jugarCorrectas,
  opcionIncorrecta,
  responder,
  siguiente,
} from './ayudas';
import { revisarMaquetacion } from './maquetacion';
import { ES_ALEMAN } from './temario';

// Estas pruebas usan el contenido del temario alemán.
test.skip(!ES_ALEMAN, 'Solo para el temario alemán');

const carpetaTemas = path.resolve(import.meta.dirname, '../../temarios/aleman/contenido/temas');

/** El enunciado y la opción más largos del banco, para probar el peor caso. */
function textosMasLargos() {
  let enunciado = '';
  let opcion = '';
  for (const tema of readdirSync(carpetaTemas)) {
    try {
      const lista = JSON.parse(
        readFileSync(path.join(carpetaTemas, tema, 'preguntas.json'), 'utf8'),
      );
      for (const p of lista) {
        if (p.enunciado.length > enunciado.length) enunciado = p.enunciado;
        for (const o of p.opciones) if (o.length > opcion.length) opcion = o;
      }
    } catch {
      /* der_die_das no tiene preguntas.json */
    }
  }
  return { enunciado, opcion };
}

const LARGO = textosMasLargos();
// Una palabra larguísima sin espacios es el caso más duro para el recorte.
const PALABRA_LARGA = 'Donaudampfschifffahrtsgesellschaftskapitän';

async function inyectarTextosLargos(page: Page) {
  await page.evaluate(
    ({ enunciado, opcion, palabra }) => {
      const titulo = document.querySelector('h2[lang]');
      if (titulo) titulo.textContent = `${enunciado} ${palabra}`;
      document.querySelectorAll('[data-opcion] .texto').forEach((el, i) => {
        el.textContent = i === 0 ? `${opcion} ${palabra}` : opcion;
      });
    },
    { ...LARGO, palabra: PALABRA_LARGA },
  );
}

for (const apariencia of APARIENCIAS) {
  for (const ancho of ANCHOS) {
    test(`maquetación ${ancho}px · ${apariencia}`, async ({ page }) => {
      const problemas: string[] = [];
      await page.setViewportSize({ width: ancho, height: 800 });
      await abrir(page, { reloj: true, apariencia });

      // Inicio y repaso, con el modal de un tema.
      problemas.push(...(await revisarMaquetacion(page, 'inicio')));
      // Selección rápida: A1 desmarca sus temas y una casilla marcada a mano deja A1 mixta.
      const nivel = (valor: string) =>
        page
          .getByRole('group', { name: 'Nivel' })
          .getByRole('button', { name: valor, exact: true });
      await nivel('A1').click();
      await page.getByRole('checkbox').nth(2).check();
      await expect(nivel('A1')).toHaveAttribute('aria-pressed', 'mixed');
      problemas.push(...(await revisarMaquetacion(page, 'inicio: selección rápida')));
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      await page.getByRole('button', { name: 'Repaso' }).click();
      problemas.push(...(await revisarMaquetacion(page, 'repaso')));
      await page.getByRole('button', { name: /Preposiciones/ }).click();
      problemas.push(...(await revisarMaquetacion(page, 'repaso: modal')));
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Volver' }).click();

      // Pregunta: normal, con el peor caso de texto y con el público.
      await comenzar(page);
      problemas.push(...(await revisarMaquetacion(page, 'pregunta')));
      await page.getByRole('button', { name: 'Público' }).click();
      await page.clock.runFor(2500);
      problemas.push(...(await revisarMaquetacion(page, 'pregunta: público')));
      await page.getByRole('button', { name: '50:50' }).click();
      problemas.push(...(await revisarMaquetacion(page, 'pregunta: 50:50')));
      await inyectarTextosLargos(page);
      problemas.push(...(await revisarMaquetacion(page, 'pregunta: texto largo')));

      // Pausa sobre la pregunta con el peor caso de texto.
      await page.getByRole('button', { name: 'Pausar (Ein Pausebrot)' }).click();
      problemas.push(...(await revisarMaquetacion(page, 'pausa')));
      await page.keyboard.press('Escape');

      // Escalera en celular.
      if (ancho < 900) {
        await page.getByRole('button', { name: 'Escalera' }).click();
        problemas.push(...(await revisarMaquetacion(page, 'escalera')));
        await page.keyboard.press('Escape');
      }

      // Resultado incorrecto y su modal.
      await responder(page, false, true);
      problemas.push(...(await revisarMaquetacion(page, 'resultado')));
      await page.getByRole('button', { name: 'Pausar (Ein Pausebrot)' }).click();
      problemas.push(...(await revisarMaquetacion(page, 'resultado: pausa')));
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /^¿Qué es «/ }).click();
      problemas.push(...(await revisarMaquetacion(page, 'resultado: modal')));
      await page.keyboard.press('Escape');

      // Derrota.
      await siguiente(page);
      await page.getByRole('heading', { name: 'Game Over' }).waitFor();
      problemas.push(...(await revisarMaquetacion(page, 'derrota')));
      await page.getByRole('button', { name: 'Nueva partida' }).click();

      // Victoria.
      await comenzar(page);
      await jugarCorrectas(page, 15);
      await siguiente(page);
      await page.getByText('Millionär', { exact: false }).first().waitFor();
      problemas.push(...(await revisarMaquetacion(page, 'victoria')));

      // Error de datos.
      await page.goto('/?semilla=1&error');
      await page.getByRole('heading', { name: 'Error al cargar los datos' }).waitFor();
      problemas.push(...(await revisarMaquetacion(page, 'error')));

      expect(problemas).toEqual([]);
    });
  }
}

// Todas las fichas, apoyos y tablas de conjugación: se juegan temas que las usan y se revisa cada resultado.
for (const ancho of [360, 768, 1280]) {
  test(`maquetación de los resultados con fichas · ${ancho}px`, async ({ page }) => {
    test.setTimeout(120_000);
    const problemas: string[] = [];
    await page.setViewportSize({ width: ancho, height: 800 });
    await abrir(page, {
      reloj: true,
      semilla: 11,
      temas: ['hora', 'conjugacion', 'acusativo', 'adverbios_frecuencia', 'der_die_das', 'numeros'],
    });
    await comenzar(page);
    for (let i = 1; i <= 15; i++) {
      await page.locator('[data-opcion]').first().waitFor();
      problemas.push(...(await revisarMaquetacion(page, `pregunta ${i}`)));
      await responder(page, true, true);
      // Se espera a que la flecha termine de dibujarse antes de medir.
      await page.clock.runFor(1500);
      problemas.push(...(await revisarMaquetacion(page, `resultado ${i}`)));
      if (i < 15) await siguiente(page);
    }
    expect(problemas).toEqual([]);
  });
}

test('un resultado incorrecto por tiempo cabe en pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await abrir(page, { reloj: true });
  await comenzar(page);
  await page.clock.runFor(31_000);
  await page.getByText('Se acabó el tiempo').waitFor();
  expect(await revisarMaquetacion(page, 'resultado por tiempo')).toEqual([]);
  expect(await opcionIncorrecta(page).count()).toBe(0);
});

// El detector de problemas también se prueba a sí mismo: debe fallar ante un problema real.
test('el detector encuentra textos montados', async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => {
    const el = document.createElement('p');
    el.textContent = 'Texto encimado de prueba';
    el.style.cssText = 'position:absolute;top:40px;left:130px';
    document.body.appendChild(el);
  });
  const problemas = await revisarMaquetacion(page);
  expect(problemas.join('\n')).toContain('texto superpuesto');
});

test('el detector encuentra scroll horizontal y texto recortado', async ({ page }) => {
  await abrir(page);
  await page.evaluate(() => {
    const b = document.createElement('button');
    b.textContent = 'Un botón con mucho texto que se sale';
    b.style.cssText = 'width:40px;overflow:hidden;white-space:nowrap';
    document.querySelector('main')!.prepend(b);
    const ancho = document.createElement('div');
    ancho.style.cssText = 'width:3000px;height:1px';
    document.body.appendChild(ancho);
  });
  const problemas = (await revisarMaquetacion(page)).join('\n');
  expect(problemas).toContain('scroll horizontal');
  expect(problemas).toContain('texto recortado');
});
