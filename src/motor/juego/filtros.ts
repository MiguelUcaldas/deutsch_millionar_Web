import type { DimensionFiltro, Tema } from '../contenido/esquemas';

/** Valores marcados por dimensión. Una dimensión sin valores marcados (o ausente) significa «todos». */
export type SeleccionFiltros = Record<string, string[]>;

export interface FilaDeFiltro {
  id: string;
  etiqueta: string;
  /** Solo los valores que tienen al menos un tema, en el orden en que los declara el temario. */
  valores: string[];
}

type ConFiltros = Pick<Tema, 'filtros'>;

/** Un tema es visible si, en cada dimensión con valores marcados, su valor es uno de ellos. */
export function temaCoincide(tema: ConFiltros, seleccion: SeleccionFiltros): boolean {
  return Object.entries(seleccion).every(
    ([dimension, valores]) =>
      valores.length === 0 || valores.includes(tema.filtros?.[dimension] ?? ''),
  );
}

/**
 * Las filas de fichas que se muestran. No aparecen los valores sin temas (si no hay temas B1, no hay
 * ficha B1) ni las dimensiones con un solo valor: una ficha única no filtra nada.
 */
export function filasDeFiltro(
  dimensiones: readonly DimensionFiltro[],
  temas: readonly ConFiltros[],
): FilaDeFiltro[] {
  return dimensiones
    .map(({ id, etiqueta, valores }) => ({
      id,
      etiqueta,
      valores: valores.filter((valor) => temas.some((tema) => tema.filtros?.[id] === valor)),
    }))
    .filter((fila) => fila.valores.length >= 2);
}

/** Descarta lo guardado que ya no existe en el temario (dimensiones o valores que cambiaron). */
export function sanearSeleccion(
  guardado: unknown,
  dimensiones: readonly DimensionFiltro[],
): SeleccionFiltros {
  const resultado: SeleccionFiltros = {};
  if (typeof guardado !== 'object' || guardado === null) return resultado;
  for (const { id, valores } of dimensiones) {
    const marcados = (guardado as Record<string, unknown>)[id];
    if (!Array.isArray(marcados)) continue;
    const validos = valores.filter((valor) => marcados.includes(valor));
    if (validos.length > 0) resultado[id] = validos;
  }
  return resultado;
}

const sinDimension = (seleccion: SeleccionFiltros, dimension: string): SeleccionFiltros =>
  Object.fromEntries(Object.entries(seleccion).filter(([id]) => id !== dimension));

export function alternarValor(
  seleccion: SeleccionFiltros,
  dimension: string,
  valor: string,
): SeleccionFiltros {
  const actuales = seleccion[dimension] ?? [];
  const nuevos = actuales.includes(valor)
    ? actuales.filter((v) => v !== valor)
    : [...actuales, valor];
  const resto = sinDimension(seleccion, dimension);
  return nuevos.length > 0 ? { ...resto, [dimension]: nuevos } : resto;
}

export function limpiarDimension(seleccion: SeleccionFiltros, dimension: string): SeleccionFiltros {
  return sinDimension(seleccion, dimension);
}
