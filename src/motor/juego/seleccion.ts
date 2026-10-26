import type { Pregunta } from '../contenido/esquemas';
import { elegirUno, type Aleatorio } from './aleatorio';

export interface HistorialSeleccion {
  preguntasUsadas: readonly string[];
  temasUsados: Readonly<Record<string, number>>;
  temaAnterior: string | null;
}

export interface ReglasSeleccion {
  maximoPorTema: number;
  unSoloTema: boolean;
  nivelMinimo: number;
  nivelMaximo: number;
}

export function calcularMaximoPorTema(
  maximoBase: number,
  cantidadPreguntas: number,
  cantidadTemas: number,
): number {
  return Math.max(maximoBase, Math.ceil(cantidadPreguntas / cantidadTemas));
}

function candidatas(
  banco: readonly Pregunta[],
  historial: HistorialSeleccion,
  reglas: ReglasSeleccion,
  nivel: number,
  respetarMaximo: boolean,
  respetarTemaAnterior: boolean,
): Pregunta[] {
  const evitarTemaAnterior = respetarTemaAnterior && !reglas.unSoloTema;
  return banco.filter((pregunta) => {
    if (pregunta.nivel !== nivel) return false;
    if (historial.preguntasUsadas.includes(pregunta.id)) return false;
    if (evitarTemaAnterior && pregunta.tema === historial.temaAnterior) return false;
    if (respetarMaximo && (historial.temasUsados[pregunta.tema] ?? 0) >= reglas.maximoPorTema) {
      return false;
    }
    return true;
  });
}

/**
 * Elige la pregunta siguiente. Si no hay candidatas relaja las reglas en orden:
 * a) nivel objetivo con todos los límites, b) sin tope por tema, c) sin evitar el tema anterior,
 * d) nivel − 1, e) nivel + 1. Primero se sortea un tema y luego una pregunta de ese tema.
 */
export function elegirPregunta(
  banco: readonly Pregunta[],
  historial: HistorialSeleccion,
  reglas: ReglasSeleccion,
  nivelObjetivo: number,
  aleatorio: Aleatorio,
): Pregunta | null {
  const intentos: [number, boolean, boolean][] = [
    [nivelObjetivo, true, true],
    [nivelObjetivo, false, true],
    [nivelObjetivo, false, false],
  ];
  if (nivelObjetivo - 1 >= reglas.nivelMinimo) intentos.push([nivelObjetivo - 1, false, false]);
  if (nivelObjetivo + 1 <= reglas.nivelMaximo) intentos.push([nivelObjetivo + 1, false, false]);

  for (const [nivel, respetarMaximo, respetarTemaAnterior] of intentos) {
    const posibles = candidatas(
      banco,
      historial,
      reglas,
      nivel,
      respetarMaximo,
      respetarTemaAnterior,
    );
    if (posibles.length === 0) continue;
    const temas = [...new Set(posibles.map((p) => p.tema))].sort();
    const tema = elegirUno(temas, aleatorio);
    return elegirUno(
      posibles.filter((p) => p.tema === tema),
      aleatorio,
    );
  }
  return null;
}
