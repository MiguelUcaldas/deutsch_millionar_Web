// Convierte los 5 JSON de la versión Python (legacy-datos/) al formato por carpetas del temario alemán.
// Se corre una sola vez: npm run migrar
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const origen = path.join(raiz, 'legacy-datos');
const destino = path.join(raiz, 'temarios', 'aleman', 'contenido');

const CONTEOS_ESPERADOS = { preguntas: 120, sustantivos: 70, temas: 11, fichas: 9, verbos: 8 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- frontera de lectura de JSON ajeno
type Json = Record<string, any>;

const leer = (archivo: string): Json =>
  JSON.parse(readFileSync(path.join(origen, archivo), 'utf8'));

function escribir(ruta: string, contenido: unknown) {
  const completa = path.join(destino, ruta);
  mkdirSync(path.dirname(completa), { recursive: true });
  writeFileSync(completa, JSON.stringify(contenido, null, 2) + '\n', 'utf8');
}

function fallar(mensaje: string): never {
  console.error(`MIGRACIÓN FALLIDA: ${mensaje}`);
  process.exit(1);
}

/** {de, es} → {original, traduccion}: el motor no sabe qué idioma es el original. */
const aEjemplo = (e: Json) => ({ original: e.de, traduccion: e.es });

function convertirFicha(ficha: Json): Json {
  if (ficha.tipo === 'escala') {
    return {
      ...ficha,
      elementos: ficha.elementos.map((e: Json) => ({ id: e.id, original: e.de, traduccion: e.es })),
    };
  }
  if (ficha.tipo === 'regla') {
    return {
      ...ficha,
      puntos: ficha.puntos.map((p: Json) => ({
        ...p,
        ...(p.ejemplos ? { ejemplos: p.ejemplos.map(aEjemplo) } : {}),
      })),
    };
  }
  return ficha;
}

function convertirPregunta(cruda: Json): Json {
  const { mostrar_reloj, verbo, persona, tiempo, ficha, ...resto } = cruda;
  const pregunta: Json = { ...resto };
  delete pregunta.tema;
  if (mostrar_reloj) pregunta.apoyo = { tipo: 'reloj', hora: mostrar_reloj };
  if (verbo) {
    if (ficha) fallar(`${cruda.id} tiene verbo y ficha a la vez`);
    pregunta.ficha = { tipo: 'conjugacion', verbo, persona, tiempo };
  } else if (ficha) {
    pregunta.ficha = ficha;
  }
  return pregunta;
}

const preguntas: Json[] = leer('preguntas.json').preguntas;
const temas: Json = leer('temas.json').temas;
const explicaciones = leer('explicaciones.json');
const sustantivos: Json = leer('sustantivos_articulos.json');
const verbos: Json = leer('verbos.json');

// El prefijo de cada tema sale de los ids de sus preguntas; der_die_das lo genera el código.
const prefijos: Record<string, string> = { der_die_das: 'DDD' };
for (const pregunta of preguntas) {
  const prefijo = String(pregunta.id).split('-')[0] ?? '';
  const previo = (prefijos[pregunta.tema] ??= prefijo);
  if (previo !== prefijo) fallar(`el tema ${pregunta.tema} mezcla prefijos ${previo} y ${prefijo}`);
}

const idsDeTema = Object.keys(temas);
idsDeTema.forEach((id, indice) => {
  const { ejemplos, ficha_principal, ...resto } = temas[id];
  delete resto.usa_tabla_verbo;
  if (!prefijos[id]) fallar(`no hay preguntas para deducir el prefijo del tema ${id}`);
  escribir(`temas/${id}/tema.json`, {
    $schema: '../../../../../esquemas/tema.schema.json',
    id,
    prefijo: prefijos[id],
    orden: indice + 1,
    nombre_corto: resto.nombre_corto,
    ...resto,
    ejemplos: ejemplos.map(aEjemplo),
    // Conjugación no tiene ficha principal: su tabla sale de la ficha de cada pregunta.
    ...(ficha_principal ? { ficha_principal } : {}),
  });
});

for (const id of idsDeTema) {
  const delTema = preguntas.filter((p) => p.tema === id).map(convertirPregunta);
  if (id === 'der_die_das') continue;
  escribir(`temas/${id}/preguntas.json`, delTema);
}

escribir('temas/der_die_das/sustantivos.json', sustantivos);
escribir('temas/conjugacion/verbos.json', verbos);

for (const [id, ficha] of Object.entries<Json>(explicaciones.fichas)) {
  escribir(`fichas/${id}.json`, convertirFicha(ficha));
}

escribir('traducciones.json', {
  enunciados_fijos: explicaciones.enunciados_fijos,
  patrones_enunciado: explicaciones.patrones_enunciado.map(aEjemplo),
});

const conteos = {
  preguntas: preguntas.length,
  sustantivos: sustantivos.sustantivos.length,
  temas: idsDeTema.length,
  fichas: Object.keys(explicaciones.fichas).length,
  verbos: verbos.verbos.length,
};
console.log('Migración terminada:', conteos);
for (const [clave, esperado] of Object.entries(CONTEOS_ESPERADOS)) {
  const real = conteos[clave as keyof typeof conteos];
  if (real !== esperado) fallar(`se esperaban ${esperado} ${clave} y hay ${real}`);
}
console.log(`Total de preguntas jugables: ${conteos.preguntas + conteos.sustantivos}`);
