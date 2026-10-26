import type { GeneradorPreguntas, Pregunta } from '@motor/contenido/esquemas';
import generoTerminaciones from '../contenido/fichas/genero_terminaciones.json';
import { leerSustantivos, type Sustantivo } from './sustantivos';

const OPCIONES_FIJAS = ['der', 'die', 'das', 'den'];
const GENERO_POR_ARTICULO = { der: 'masculino', die: 'femenino', das: 'neutro' } as const;

interface PuntoGenero {
  id: string;
  terminaciones?: string[];
}

/** Elige el punto de la ficha según la terminación de la palabra («sin_regla» si ninguno aplica). */
export function puntoDeGenero(palabra: string, puntos: PuntoGenero[]): string {
  const minuscula = palabra.toLowerCase();
  const punto = puntos.find((p) => p.terminaciones?.some((t) => minuscula.endsWith(t)));
  return punto?.id ?? 'sin_regla';
}

/** Nota que aclara el choque entre el género alemán y el español. Vacía si coinciden. */
export function notaDeContraste(sustantivo: Sustantivo): string {
  const generoAleman = GENERO_POR_ARTICULO[sustantivo.articulo];
  if (!sustantivo.genero_es) return '';
  const base = `${sustantivo.articulo} ${sustantivo.palabra} — ${sustantivo.traduccion ?? ''}`;
  if (generoAleman === 'neutro') return `${base} (en alemán es neutro).`;
  if (generoAleman !== sustantivo.genero_es) {
    return `${base} (en español es ${sustantivo.genero_es}).`;
  }
  return '';
}

export function generarPregunta(
  sustantivo: Sustantivo,
  puntos: PuntoGenero[],
): Omit<Pregunta, 'tema'> {
  const generoAleman = GENERO_POR_ARTICULO[sustantivo.articulo];
  let explicacion = `${sustantivo.palabra} es ${generoAleman}: ${sustantivo.articulo} ${sustantivo.palabra}.`;
  const nota = notaDeContraste(sustantivo);
  if (nota) explicacion += ` ${nota}`;

  let traduccion = `${sustantivo.articulo} ${sustantivo.palabra}`;
  if (sustantivo.plural) traduccion += ` → die ${sustantivo.plural}`;
  if (sustantivo.traduccion) traduccion += ` · ${sustantivo.traduccion}`;

  return {
    id: `DDD-${sustantivo.palabra}`,
    nivel: sustantivo.nivel,
    enunciado: `___ ${sustantivo.palabra}`,
    subtitulo: 'Welcher Artikel ist richtig?',
    opciones: [...OPCIONES_FIJAS],
    correcta: sustantivo.articulo,
    explicacion,
    traduccion,
    mantener_orden: true,
    ficha: 'genero_terminaciones',
    resaltar: [puntoDeGenero(sustantivo.palabra, puntos)],
  };
}

export const generadorDerDieDas: GeneradorPreguntas = {
  tema: 'der_die_das',
  archivoDatos: 'sustantivos.json',
  generar(datos) {
    const puntos = generoTerminaciones.puntos as PuntoGenero[];
    return leerSustantivos(datos).validos.map((s) => generarPregunta(s, puntos));
  },
};
