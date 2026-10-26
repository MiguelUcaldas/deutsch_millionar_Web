import type { Aleatorio } from '../juego/aleatorio';
import {
  esquemaFicha,
  esquemaPregunta,
  esquemaTema,
  esquemaTraducciones,
  type ConfiguracionJuego,
  type Ficha,
  type Pregunta,
  type Tema,
  type Traducciones,
} from './esquemas';
import type { Registro } from './registro';

export interface CarpetaDeTema {
  tema?: unknown;
  preguntas?: unknown;
  /** Otros JSON de la carpeta (`sustantivos.json`, `verbos.json`...), por nombre de archivo. */
  datos: Record<string, unknown>;
}

/** Contenido tal cual se leyó de disco, sin validar. */
export interface FuentesContenido {
  temas: Record<string, CarpetaDeTema>;
  fichas: Record<string, unknown>;
  traducciones?: unknown;
}

export interface Banco {
  temas: Tema[];
  preguntas: Pregunta[];
  /** Solo las fichas genéricas (tabla, escala, regla), por id de archivo. */
  fichas: Record<string, Ficha>;
  traducciones: Traducciones;
  /** Todo lo que se omitió y por qué. En CI cada aviso es un error. */
  avisos: string[];
}

const RUTA_TEMA = /\/temas\/([^/]+)\/([^/]+)\.json$/;
const RUTA_FICHA = /\/fichas\/([^/]+)\.json$/;
const RUTA_TRADUCCIONES = /\/traducciones\.json$/;

/** Convierte el resultado de `import.meta.glob` (ruta → contenido) en `FuentesContenido`. */
export function fuentesDesdeModulos(modulos: Record<string, unknown>): FuentesContenido {
  const fuentes: FuentesContenido = { temas: {}, fichas: {} };
  for (const [ruta, contenido] of Object.entries(modulos)) {
    const normalizada = ruta.replaceAll('\\', '/');
    const deTema = RUTA_TEMA.exec(normalizada);
    if (deTema) {
      const [, carpeta, archivo] = deTema as unknown as [string, string, string];
      const entrada = (fuentes.temas[carpeta] ??= { datos: {} });
      if (archivo === 'tema') entrada.tema = contenido;
      else if (archivo === 'preguntas') entrada.preguntas = contenido;
      else entrada.datos[`${archivo}.json`] = contenido;
      continue;
    }
    const deFicha = RUTA_FICHA.exec(normalizada);
    if (deFicha) {
      fuentes.fichas[deFicha[1]!] = contenido;
      continue;
    }
    if (RUTA_TRADUCCIONES.test(normalizada)) fuentes.traducciones = contenido;
  }
  return fuentes;
}

function describirIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .map((i) => `${i.path.length ? i.path.join('.') : '(raíz)'}: ${i.message}`)
    .join('; ');
}

interface DatosDeValidacion {
  tema: Tema;
  juego: ConfiguracionJuego;
  fichas: Record<string, Ficha>;
  registro: Registro;
  idsVistos: Set<string>;
}

/** Devuelve el motivo por el que la pregunta no se puede usar, o null si es válida. */
function problemaDePregunta(pregunta: Pregunta, datos: DatosDeValidacion): string | null {
  const { tema, juego, fichas, registro, idsVistos } = datos;
  if (idsVistos.has(pregunta.id)) return 'id repetido';
  if (!pregunta.id.startsWith(`${tema.prefijo}-`)) {
    return `el id debe empezar por «${tema.prefijo}-»`;
  }
  if (!juego.nivelPorPregunta.includes(pregunta.nivel)) {
    return `el nivel ${pregunta.nivel} no existe en la configuración`;
  }
  if (new Set(pregunta.opciones).size !== pregunta.opciones.length) return 'opciones repetidas';
  if (!pregunta.opciones.includes(pregunta.correcta)) return 'la correcta no está en las opciones';
  if (typeof pregunta.ficha === 'string' && !(pregunta.ficha in fichas)) {
    return `la ficha «${pregunta.ficha}» no existe`;
  }
  if (typeof pregunta.ficha === 'object' && !registro.tiposDeFicha.has(pregunta.ficha.tipo)) {
    return `el tipo de ficha «${pregunta.ficha.tipo}» no está registrado`;
  }
  if (pregunta.apoyo && !(pregunta.apoyo.tipo in registro.apoyos)) {
    return `el tipo de apoyo «${pregunta.apoyo.tipo}» no está registrado`;
  }
  return null;
}

/**
 * Arma el banco de preguntas validando todo. En ejecución es tolerante: lo inválido se omite
 * y queda anotado en `avisos`, el juego sigue con lo que sí sirve.
 */
export function armarBanco(
  fuentes: FuentesContenido,
  juego: ConfiguracionJuego,
  registro: Registro,
  aleatorio: Aleatorio,
): Banco {
  const avisos: string[] = [];

  const fichas: Record<string, Ficha> = {};
  for (const [id, crudo] of Object.entries(fuentes.fichas)) {
    const lectura = esquemaFicha.safeParse(crudo);
    if (lectura.success) fichas[id] = lectura.data;
    else avisos.push(`fichas/${id}.json: ${describirIssues(lectura.error)}`);
  }

  let traducciones: Traducciones = { enunciados_fijos: {}, patrones_enunciado: [] };
  if (fuentes.traducciones !== undefined) {
    const lectura = esquemaTraducciones.safeParse(fuentes.traducciones);
    if (lectura.success) traducciones = lectura.data;
    else avisos.push(`traducciones.json: ${describirIssues(lectura.error)}`);
  }

  const temas: Tema[] = [];
  const preguntas: Pregunta[] = [];
  const idsVistos = new Set<string>();

  const agregar = (crudas: unknown[], tema: Tema, origen: string) => {
    crudas.forEach((crudo, posicion) => {
      const lectura = esquemaPregunta.safeParse(crudo);
      const etiqueta = `${origen}[${posicion}]`;
      if (!lectura.success) {
        avisos.push(`${etiqueta}: ${describirIssues(lectura.error)}`);
        return;
      }
      const pregunta: Pregunta = { ...lectura.data, tema: tema.id };
      const problema = problemaDePregunta(pregunta, { tema, juego, fichas, registro, idsVistos });
      if (problema) {
        avisos.push(`${etiqueta} (${pregunta.id}): ${problema}`);
        return;
      }
      idsVistos.add(pregunta.id);
      preguntas.push(pregunta);
    });
  };

  for (const [carpeta, contenido] of Object.entries(fuentes.temas)) {
    const lecturaTema = esquemaTema.safeParse(contenido.tema);
    if (!lecturaTema.success) {
      avisos.push(`temas/${carpeta}/tema.json: ${describirIssues(lecturaTema.error)}`);
      continue;
    }
    const tema = lecturaTema.data;
    if (tema.id !== carpeta) {
      avisos.push(`temas/${carpeta}/tema.json: el id «${tema.id}» no coincide con la carpeta`);
      continue;
    }
    temas.push(tema);

    if (contenido.preguntas === undefined) continue;
    if (!Array.isArray(contenido.preguntas)) {
      avisos.push(`temas/${carpeta}/preguntas.json: debe ser una lista`);
      continue;
    }
    agregar(contenido.preguntas, tema, `temas/${carpeta}/preguntas.json`);
  }

  for (const generador of registro.generadores) {
    const tema = temas.find((t) => t.id === generador.tema);
    const datos = fuentes.temas[generador.tema]?.datos[generador.archivoDatos];
    if (!tema || datos === undefined) {
      avisos.push(`generador de «${generador.tema}»: falta ${generador.archivoDatos}`);
      continue;
    }
    agregar(generador.generar(datos, aleatorio), tema, `generador:${generador.tema}`);
  }

  temas.sort((a, b) => a.orden - b.orden);
  return { temas, preguntas, fichas, traducciones, avisos };
}
