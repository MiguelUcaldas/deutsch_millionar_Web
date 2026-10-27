import type { DimensionFiltro, Tema } from '../contenido/esquemas';

export interface FilaDeFiltro {
  id: string;
  etiqueta: string;
  /** Solo los valores que tienen al menos un tema, en el orden en que los declara el temario. */
  valores: string[];
}

type TemaConFiltros = Pick<Tema, 'id' | 'filtros'>;

/** Cuántos temas de un valor están marcados: todos, algunos o ninguno. */
export type EstadoDeValor = 'todos' | 'algunos' | 'ninguno';

/**
 * Las fichas de selección rápida que se muestran. No aparecen los valores sin temas (si no hay temas B1,
 * no hay ficha B1) ni las dimensiones con un solo valor: una ficha única no distingue nada.
 */
export function filasDeFiltro(
  dimensiones: readonly DimensionFiltro[],
  temas: readonly TemaConFiltros[],
): FilaDeFiltro[] {
  return dimensiones
    .map(({ id, etiqueta, valores }) => ({
      id,
      etiqueta,
      valores: valores.filter((valor) => temas.some((tema) => tema.filtros?.[id] === valor)),
    }))
    .filter((fila) => fila.valores.length >= 2);
}

/** Los valores que abarca una ficha: solo el suyo o, si la dimensión es acumulativa, también los anteriores. */
function valoresAbarcados(dimension: DimensionFiltro, valor: string): string[] {
  if (!dimension.acumulativa) return [valor];
  const posicion = dimension.valores.indexOf(valor);
  return posicion < 0 ? [valor] : dimension.valores.slice(0, posicion + 1);
}

const temasDelValor = (
  temas: readonly TemaConFiltros[],
  dimension: DimensionFiltro,
  valor: string,
) => {
  const abarcados = valoresAbarcados(dimension, valor);
  return temas.filter((tema) => abarcados.includes(tema.filtros?.[dimension.id] ?? ''));
};

/** El estado de una ficha sale siempre de las casillas marcadas: no se guarda aparte. */
export function estadoDeValor(
  temas: readonly TemaConFiltros[],
  elegidos: readonly string[],
  dimension: DimensionFiltro,
  valor: string,
): EstadoDeValor {
  const delValor = temasDelValor(temas, dimension, valor);
  const marcados = delValor.filter((tema) => elegidos.includes(tema.id)).length;
  if (delValor.length > 0 && marcados === delValor.length) return 'todos';
  return marcados > 0 ? 'algunos' : 'ninguno';
}

/**
 * Pulsar una ficha: si todos los temas que abarca están marcados se desmarcan; si falta alguno,
 * se marcan todos. Los temas que no abarca no se tocan.
 */
export function alternarTemasDeValor(
  temas: readonly TemaConFiltros[],
  elegidos: readonly string[],
  dimension: DimensionFiltro,
  valor: string,
): string[] {
  const ids = temasDelValor(temas, dimension, valor).map((tema) => tema.id);
  if (estadoDeValor(temas, elegidos, dimension, valor) === 'todos') {
    return elegidos.filter((id) => !ids.includes(id));
  }
  return [...elegidos, ...ids.filter((id) => !elegidos.includes(id))];
}
