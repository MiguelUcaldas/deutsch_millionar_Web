import { crearAleatorio } from '../juego/aleatorio';
import { reconstruirOracion } from '../juego/oraciones';
import { traducirEnunciado } from '../juego/traducciones';
import { armarBanco, type Banco, type FuentesContenido } from './cargar';
import {
  esquemaConfiguracion,
  type ConfiguracionTemario,
  type Ficha,
  type Pregunta,
} from './esquemas';
import { crearRegistro } from './registro';

const ESPACIO = '___';
const MINIMO_POR_NIVEL = 5;
const MINIMO_POR_TEMA = 5;

export interface ContextoValidacion {
  banco: Banco;
  fuentes: FuentesContenido;
}

export interface ResultadoValidacion {
  errores: string[];
  avisos?: string[];
}

/** Comprobación propia de un temario (por ejemplo, que las conjugaciones coincidan con su tabla de verbos). */
export type Validador = (contexto: ContextoValidacion) => ResultadoValidacion;

export interface InformeValidacion {
  errores: string[];
  avisos: string[];
  /** Cantidad de preguntas por tema y nivel. */
  conteo: Record<string, Record<number, number>>;
  totalPreguntas: number;
}

function idsDeFicha(ficha: Ficha): Set<string> {
  switch (ficha.tipo) {
    case 'tabla':
      return new Set(
        ficha.filas.flatMap((fila) => [
          fila.id,
          ...ficha.columnas.map((columna) => `${fila.id}.${columna.id}`),
        ]),
      );
    case 'escala':
      return new Set(ficha.elementos.map((e) => e.id));
    case 'regla':
      return new Set(ficha.puntos.map((p) => p.id));
  }
}

function validarReferenciasDeFicha(pregunta: Pregunta, fichas: Banco['fichas']): string[] {
  // Las fichas de extensión (objeto) las valida el propio temario.
  if (typeof pregunta.ficha !== 'string') return [];
  const ficha = fichas[pregunta.ficha];
  if (!ficha) return [];
  const validos = idsDeFicha(ficha);
  const errores: string[] = [];
  for (const [i, id] of (pregunta.resaltar ?? []).entries()) {
    if (!validos.has(id)) {
      errores.push(
        `${pregunta.id} → resaltar[${i}]: «${id}» no existe en la ficha «${pregunta.ficha}»`,
      );
    }
  }
  for (const [i, id] of (pregunta.flecha ?? []).entries()) {
    if (!validos.has(id)) {
      errores.push(
        `${pregunta.id} → flecha[${i}]: «${id}» no existe en la ficha «${pregunta.ficha}»`,
      );
    }
  }
  return errores;
}

function validarHuecos(pregunta: Pregunta): string[] {
  const huecos = pregunta.enunciado.split(ESPACIO).length - 1;
  if (huecos === 0) return [];
  const partes = pregunta.correcta.split(' / ').length;
  return huecos === partes
    ? []
    : [
        `${pregunta.id}: el enunciado tiene ${huecos} espacios pero «correcta» tiene ${partes} partes`,
      ];
}

/** Las piezas de `estructura` deben aparecer, en orden, dentro de la oración (con o sin espacios). */
function validarEstructura(pregunta: Pregunta): string[] {
  if (!pregunta.estructura?.length) return [];
  const textos = pregunta.estructura.map((pieza) => pieza.texto);
  const oracion = reconstruirOracion(pregunta)
    .map((s) => s.texto)
    .join('');
  const objetivos = [oracion, `${pregunta.enunciado} ${pregunta.correcta}`];
  const posibles = [textos.join(' '), textos.join('')];
  const coincide = posibles.some((reconstruido) => objetivos.some((o) => o.includes(reconstruido)));
  return coincide
    ? []
    : [
        `${pregunta.id}: la estructura («${textos.join(' ')}») no reconstruye la oración «${oracion}»`,
      ];
}

function validarTraducciones(banco: Banco): string[] {
  const errores: string[] = [];
  const vistos = new Set<string>();
  for (const pregunta of banco.preguntas) {
    if (!pregunta.traduccion?.trim()) errores.push(`${pregunta.id}: falta la traducción`);
    if (pregunta.enunciado.includes(ESPACIO) || vistos.has(pregunta.enunciado)) continue;
    vistos.add(pregunta.enunciado);
    if (traducirEnunciado(pregunta.enunciado, banco.traducciones) === null) {
      errores.push(
        `${pregunta.id}: el enunciado «${pregunta.enunciado}» no tiene traducción conocida`,
      );
    }
  }
  return errores;
}

function contar(banco: Banco) {
  const conteo: InformeValidacion['conteo'] = {};
  for (const tema of banco.temas) conteo[tema.id] = {};
  for (const pregunta of banco.preguntas) {
    const porNivel = (conteo[pregunta.tema] ??= {});
    porNivel[pregunta.nivel] = (porNivel[pregunta.nivel] ?? 0) + 1;
  }
  return conteo;
}

/**
 * Revisa todo el contenido de un temario. A diferencia de la carga en ejecución, que omite
 * lo inválido, aquí cada entrada omitida es un error.
 */
export function validarContenido(
  fuentes: FuentesContenido,
  configuracion: ConfiguracionTemario,
): InformeValidacion {
  const errores: string[] = [];
  const avisos: string[] = [];

  const lecturaConfig = esquemaConfiguracion.safeParse(configuracion);
  if (!lecturaConfig.success) {
    for (const issue of lecturaConfig.error.issues) {
      errores.push(`temario.config.ts → ${issue.path.join('.') || '(raíz)'}: ${issue.message}`);
    }
    return { errores, avisos, conteo: {}, totalPreguntas: 0 };
  }

  const registro = crearRegistro(configuracion.extensiones);
  const banco = armarBanco(fuentes, configuracion.juego, registro, crearAleatorio(1));
  errores.push(...banco.avisos);

  for (const tema of banco.temas) {
    if (tema.ficha_principal && !(tema.ficha_principal in banco.fichas)) {
      errores.push(
        `temas/${tema.id}/tema.json → ficha_principal: «${tema.ficha_principal}» no existe`,
      );
    }
  }
  for (const pregunta of banco.preguntas) {
    errores.push(
      ...validarReferenciasDeFicha(pregunta, banco.fichas),
      ...validarHuecos(pregunta),
      ...validarEstructura(pregunta),
    );
  }
  // Solo los contenidos en otro idioma necesitan traducción del enunciado.
  if (configuracion.idiomaContenido) errores.push(...validarTraducciones(banco));

  for (const validador of configuracion.extensiones?.validadores ?? []) {
    const resultado = validador({ banco, fuentes });
    errores.push(...resultado.errores);
    avisos.push(...(resultado.avisos ?? []));
  }

  const conteo = contar(banco);
  const niveles = [...new Set(configuracion.juego.nivelPorPregunta)].sort();
  for (const nivel of niveles) {
    const total = banco.preguntas.filter((p) => p.nivel === nivel).length;
    if (total < MINIMO_POR_NIVEL) {
      avisos.push(
        `El nivel ${nivel} tiene solo ${total} preguntas; el comodín Cambiar podría no tener alternativas.`,
      );
    }
  }
  for (const tema of banco.temas) {
    const total = Object.values(conteo[tema.id] ?? {}).reduce((a, b) => a + b, 0);
    if (total < MINIMO_POR_TEMA) avisos.push(`El tema «${tema.id}» tiene solo ${total} preguntas.`);
  }

  return { errores, avisos, conteo, totalPreguntas: banco.preguntas.length };
}
