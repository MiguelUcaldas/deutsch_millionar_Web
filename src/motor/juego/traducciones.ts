import type { Traducciones } from '../contenido/esquemas';

function expresionDePatron(patron: string): RegExp {
  const partes = patron.split('{x}').map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${partes.join('(.+)')}$`);
}

/**
 * Traduce un enunciado sin hueco: primero los enunciados fijos y luego los patrones,
 * en el orden en que están escritos (el más específico va antes). Devuelve null si no hay coincidencia.
 */
export function traducirEnunciado(enunciado: string, traducciones: Traducciones): string | null {
  const fijo = traducciones.enunciados_fijos[enunciado];
  if (fijo !== undefined) return fijo;

  for (const patron of traducciones.patrones_enunciado) {
    const coincidencia = expresionDePatron(patron.original).exec(enunciado);
    if (coincidencia) return patron.traduccion.replace('{x}', coincidencia[1]!);
  }
  return null;
}
