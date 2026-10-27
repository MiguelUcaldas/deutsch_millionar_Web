import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

export const ANCHOS = [360, 390, 768, 1024, 1280, 1440] as const;
export const APARIENCIAS = ['oscuro', 'claro'] as const;

interface OpcionesAbrir {
  semilla?: number;
  apariencia?: string;
  /** Temas guardados como elegidos (si no se indica, todos). */
  temas?: string[];
  /** Reloj falso: el tiempo solo avanza con `avanzar`. */
  reloj?: boolean;
  consulta?: string;
}

/** Abre el juego con una semilla fija, sin cargar fuentes externas (para resultados repetibles). */
export async function abrir(page: Page, opciones: OpcionesAbrir = {}) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (ruta) => ruta.abort());
  await page.addInitScript(
    ({ apariencia, temas }) => {
      try {
        if (apariencia)
          localStorage.setItem('millonario:aleman:apariencia', JSON.stringify(apariencia));
        if (temas) localStorage.setItem('millonario:aleman:temas', JSON.stringify(temas));
      } catch {
        /* sin almacenamiento */
      }
    },
    { apariencia: opciones.apariencia, temas: opciones.temas },
  );
  if (opciones.reloj) await page.clock.install({ time: 0 });
  await page.goto(`/?semilla=${opciones.semilla ?? 7}${opciones.consulta ?? ''}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
}

/** Hace pasar `ms` milisegundos del reloj falso. */
export const avanzar = (page: Page, ms: number) => page.clock.runFor(ms);

export async function comenzar(page: Page) {
  await page.getByRole('button', { name: 'Comenzar' }).click();
  await page.locator('[data-opcion]').first().waitFor();
}

export const opcionCorrecta = (page: Page) => page.locator('[data-correcta="true"]');

export const opcionIncorrecta = (page: Page) =>
  page.locator('[data-opcion]:not([data-correcta="true"]):not([disabled])').first();

// Suspenso (sonando + silencio) y pausa antes del resultado, leídos de la config del alemán
// (no se importa el módulo porque trae componentes .svelte que Playwright no sabe cargar).
const configAleman = readFileSync(
  path.resolve(import.meta.dirname, '../../temarios/aleman/temario.config.ts'),
  'utf8',
);
const duracion = (campo: string) =>
  Number(new RegExp(String.raw`${campo}:\s*(\d+)`).exec(configAleman)![1]);
export const SUSPENSO_MS = duracion('suspensoSonando') + duracion('suspensoSilencio');
const SUSPENSO_Y_REVELACION_MS = SUSPENSO_MS + duracion('antesDeResultado') + 100;

/**
 * Responde. Con reloj falso hace pasar el suspenso y la revelación; con reloj real los espera.
 * Termina en la pantalla de resultado.
 */
export async function responder(page: Page, correcta: boolean, relojFalso = false) {
  await (correcta ? opcionCorrecta(page) : opcionIncorrecta(page)).click();
  if (relojFalso) await avanzar(page, SUSPENSO_Y_REVELACION_MS);
  await page.getByRole('button', { name: /^Siguiente/ }).waitFor({ timeout: 8000 });
}

export async function siguiente(page: Page) {
  await page.getByRole('button', { name: /^Siguiente/ }).click();
}

/** Juega `cantidad` preguntas correctas seguidas (la última queda en la pantalla de resultado). */
export async function jugarCorrectas(page: Page, cantidad: number) {
  for (let i = 1; i <= cantidad; i++) {
    await responder(page, true, true);
    if (i < cantidad) {
      await siguiente(page);
      await page.locator('[data-opcion]').first().waitFor();
    }
  }
}
