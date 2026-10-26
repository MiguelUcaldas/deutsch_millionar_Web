import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** El temario que sirve el servidor de pruebas: la variable de entorno, luego `.env`, luego «aleman». */
function leerTemario(): string {
  if (process.env.TEMARIO) return process.env.TEMARIO;
  const archivo = path.resolve(import.meta.dirname, '../../.env');
  if (existsSync(archivo)) {
    const linea = readFileSync(archivo, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('TEMARIO='));
    if (linea) return linea.slice('TEMARIO='.length).trim();
  }
  return 'aleman';
}

export const TEMARIO = leerTemario();

/** Las pruebas con contenido del alemán se omiten en cualquier otro temario. */
export const ES_ALEMAN = TEMARIO === 'aleman';
