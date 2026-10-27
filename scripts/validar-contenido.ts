// Revisa el contenido del temario elegido (TEMARIO, por defecto «aleman») sin abrir el juego.
// Se ejecuta con: npm run validar
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { validarSonidos } from './validar-sonidos.ts';

const raiz = path.resolve(import.meta.dirname, '..');
const temario = process.env.TEMARIO ?? 'aleman';
const carpetaContenido = path.join(raiz, 'temarios', temario, 'contenido');

function archivosJson(carpeta: string): string[] {
  try {
    return readdirSync(carpeta).flatMap((nombre) => {
      const ruta = path.join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) return archivosJson(ruta);
      return nombre.endsWith('.json') ? [ruta] : [];
    });
  } catch {
    return [];
  }
}

/** Revisa la sintaxis de cada JSON antes de cargar nada, para poder dar línea y columna. */
function revisarSintaxis(): string[] {
  const errores: string[] = [];
  for (const archivo of archivosJson(carpetaContenido)) {
    const texto = readFileSync(archivo, 'utf8');
    try {
      JSON.parse(texto);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      const posicion = /position (\d+)/.exec(mensaje);
      let lugar = '';
      if (posicion) {
        const antes = texto.slice(0, Number(posicion[1]));
        const linea = antes.split('\n').length;
        const columna = antes.length - antes.lastIndexOf('\n');
        lugar = ` (línea ${linea}, columna ${columna})`;
      }
      errores.push(`${path.relative(raiz, archivo)}${lugar}: JSON mal formado — ${mensaje}`);
    }
  }
  return errores;
}

function imprimirTabla(conteo: Record<string, Record<number, number>>, niveles: number[]) {
  const columnas = niveles.map((n) => String(n).padStart(4)).join(' ');
  console.log(`${'tema'.padEnd(28)} ${columnas} ${'total'.padStart(6)}`);
  for (const [tema, porNivel] of Object.entries(conteo)) {
    const valores = niveles.map((n) => porNivel[n] ?? 0);
    const total = valores.reduce((a, b) => a + b, 0);
    console.log(
      `${tema.padEnd(28)} ${valores.map((v) => String(v).padStart(4)).join(' ')} ${String(total).padStart(6)}`,
    );
  }
}

console.log(`Validando el temario «${temario}»...\n`);

const erroresDeSintaxis = revisarSintaxis();
if (erroresDeSintaxis.length > 0) {
  console.error(`${erroresDeSintaxis.length} error(es) de sintaxis:`);
  erroresDeSintaxis.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

// Vite carga el temario como lo haría el navegador (alias, .svelte, import.meta.glob).
const servidor = await createServer({
  root: raiz,
  appType: 'custom',
  server: { middlewareMode: true },
  logLevel: 'error',
});

let codigoSalida = 0;
try {
  const modulo = await servidor.ssrLoadModule('/scripts/validar-entrada.ts');
  const informe = modulo.validarTemarioActual();
  const niveles = [...new Set<number>(modulo.niveles)].sort();
  informe.errores.push(...(await validarSonidos(modulo.sonidosDelTemario)));

  console.log(`Preguntas jugables: ${informe.totalPreguntas}\n`);
  imprimirTabla(informe.conteo, niveles);
  console.log();
  informe.avisos.forEach((a: string) => console.log(`AVISO: ${a}`));
  if (informe.errores.length > 0) {
    console.error(`\n${informe.errores.length} error(es) encontrados:`);
    informe.errores.forEach((e: string) => console.error(`  - ${e}`));
    codigoSalida = 1;
  } else {
    console.log('\nSin errores.');
  }
} catch (error) {
  console.error(error);
  codigoSalida = 1;
} finally {
  await servidor.close();
}
process.exit(codigoSalida);
