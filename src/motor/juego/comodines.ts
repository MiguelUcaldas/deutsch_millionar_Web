import type { Pregunta } from '../contenido/esquemas';
import { elegirUno, elegirVarios, enteroEntre, type Aleatorio } from './aleatorio';
import type { HistorialSeleccion } from './seleccion';

export type Comodin = 'cincuentaCincuenta' | 'publico' | 'cambiar';

/** Elimina dos opciones incorrectas al azar. */
export function aplicarCincuenta(pregunta: Pregunta, aleatorio: Aleatorio): string[] {
  const incorrectas = pregunta.opciones.filter((opcion) => opcion !== pregunta.correcta);
  return elegirVarios(incorrectas, 2, aleatorio);
}

/**
 * Porcentajes enteros que siempre suman 100. La correcta cae dentro del rango de su nivel
 * y el resto se reparte entre las incorrectas que siguen visibles; las eliminadas quedan en 0.
 */
export function calcularPublico(
  pregunta: Pregunta,
  eliminadas: readonly string[],
  rangos: Record<string, [number, number]>,
  aleatorio: Aleatorio,
): Record<string, number> {
  const resultado: Record<string, number> = Object.fromEntries(
    pregunta.opciones.map((opcion) => [opcion, 0]),
  );
  const otrasVisibles = pregunta.opciones.filter(
    (opcion) => opcion !== pregunta.correcta && !eliminadas.includes(opcion),
  );
  if (otrasVisibles.length === 0) {
    resultado[pregunta.correcta] = 100;
    return resultado;
  }

  const [minimo, maximo] = rangos[String(pregunta.nivel)]!;
  const correcta = enteroEntre(minimo, maximo, aleatorio);
  resultado[pregunta.correcta] = correcta;

  const restante = 100 - correcta;
  const cortes = Array.from({ length: otrasVisibles.length - 1 }, () =>
    enteroEntre(0, restante, aleatorio),
  ).sort((a, b) => a - b);
  let anterior = 0;
  [...cortes, restante].forEach((corte, i) => {
    resultado[otrasVisibles[i]!] = corte - anterior;
    anterior = corte;
  });
  return resultado;
}

/**
 * Pregunta de reemplazo para Cambiar: mismo nivel, no usada, dentro de los temas elegidos
 * (el banco ya viene filtrado). Prefiere otro tema. Si no hay ninguna devuelve null.
 */
export function buscarReemplazo(
  banco: readonly Pregunta[],
  actual: Pregunta,
  historial: HistorialSeleccion,
  aleatorio: Aleatorio,
): Pregunta | null {
  const posibles = banco.filter(
    (p) => p.nivel === actual.nivel && !historial.preguntasUsadas.includes(p.id),
  );
  if (posibles.length === 0) return null;
  const otroTema = posibles.filter((p) => p.tema !== actual.tema);
  return elegirUno(otroTema.length > 0 ? otroTema : posibles, aleatorio);
}
