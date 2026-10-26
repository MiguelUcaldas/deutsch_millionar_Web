// Crea un temario nuevo a partir de la plantilla y lo deja elegido en `.env`.
// Se ejecuta con: npm run nuevo-temario -- historia
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const id = process.argv[2];

if (!id || !/^[a-z0-9_-]+$/.test(id)) {
  console.error(
    'Uso: npm run nuevo-temario -- <id>   (solo minúsculas, números, guion y guion bajo)',
  );
  process.exit(1);
}

const origen = path.join(raiz, 'temarios', 'plantilla');
const destino = path.join(raiz, 'temarios', id);

if (existsSync(destino)) {
  console.error(`Ya existe temarios/${id}. Elige otro nombre o bórralo primero.`);
  process.exit(1);
}
if (!existsSync(origen)) {
  console.error('No se encontró temarios/plantilla.');
  process.exit(1);
}

cpSync(origen, destino, { recursive: true });

const archivoConfig = path.join(destino, 'temario.config.ts');
const config = readFileSync(archivoConfig, 'utf8').replace(/id: 'plantilla'/, `id: '${id}'`);
writeFileSync(archivoConfig, config);

// Deja elegido el temario nuevo: `npm run dev` lo usa sin pasar variables.
const archivoEntorno = path.join(raiz, '.env');
const entorno = existsSync(archivoEntorno) ? readFileSync(archivoEntorno, 'utf8') : '';
const lineas = entorno.split(/\r?\n/).filter((linea) => linea && !linea.startsWith('TEMARIO='));
writeFileSync(archivoEntorno, [...lineas, `TEMARIO=${id}`].join('\n') + '\n');

console.log(`Temario «${id}» creado en temarios/${id} y elegido en .env.`);
console.log('Siguientes pasos:');
console.log(`  1. Edita temarios/${id}/temario.config.ts (título, reglas, premios, textos).`);
console.log(
  `  2. Reemplaza el contenido de temarios/${id}/contenido/temas/ por tus temas y preguntas.`,
);
console.log('  3. npm run validar   hasta que no haya errores');
console.log('  4. npm run dev       para jugar');
