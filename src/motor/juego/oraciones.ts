import type { Pregunta } from '../contenido/esquemas';

const ESPACIO = '___';
const SEPARADOR_PARTES = ' / ';
const SIN_RELLENO = '—';

export interface SegmentoOracion {
  texto: string;
  insertado: boolean;
}

function limpiar(texto: string): string {
  return texto
    .replace(/ {2,}/g, ' ')
    .replace(/ ([.?])/g, '$1')
    .trim();
}

/** Texto plano de la oración completa. */
export function oracionCompleta(
  pregunta: Pick<Pregunta, 'enunciado' | 'correcta' | 'oracion_completa'>,
): string {
  return reconstruirOracion(pregunta)
    .map((segmento) => segmento.texto)
    .join('');
}

/**
 * Rellena los `___` del enunciado con la respuesta y marca qué segmentos se insertaron.
 * Una `oracion_completa` propia tiene prioridad; un enunciado sin espacios usa la respuesta tal cual.
 * En respuestas de varias partes (`a / b`), «—» significa «no se inserta nada».
 */
export function reconstruirOracion(
  pregunta: Pick<Pregunta, 'enunciado' | 'correcta' | 'oracion_completa'>,
): SegmentoOracion[] {
  if (pregunta.oracion_completa) return [{ texto: pregunta.oracion_completa, insertado: false }];
  if (!pregunta.enunciado.includes(ESPACIO))
    return [{ texto: pregunta.correcta, insertado: false }];

  const partes = pregunta.correcta.split(SEPARADOR_PARTES);
  const trozos = pregunta.enunciado.split(ESPACIO);
  const segmentos: SegmentoOracion[] = [];
  trozos.forEach((trozo, i) => {
    if (trozo) segmentos.push({ texto: trozo, insertado: false });
    if (i < trozos.length - 1) {
      const relleno = partes[i] === SIN_RELLENO ? '' : (partes[i] ?? '');
      if (relleno) segmentos.push({ texto: relleno, insertado: true });
    }
  });

  return normalizarEspacios(segmentos);
}

/**
 * Aplica la misma limpieza que sobre el texto plano (espacios dobles, espacio antes de . o ?)
 * pero conservando los segmentos para poder resaltarlos.
 */
function normalizarEspacios(segmentos: SegmentoOracion[]): SegmentoOracion[] {
  const plano = limpiar(segmentos.map((s) => s.texto).join(''));
  const resultado: SegmentoOracion[] = [];
  let resto = plano;

  for (const segmento of segmentos) {
    if (resto.length === 0) break;
    const objetivo = limpiar(segmento.texto);
    if (!objetivo) continue;
    const inicio = resto.indexOf(objetivo);
    if (inicio === -1) continue;
    const separador = resto.slice(0, inicio);
    if (separador) resultado.push({ texto: separador, insertado: false });
    resultado.push({ texto: objetivo, insertado: segmento.insertado });
    resto = resto.slice(inicio + objetivo.length);
  }
  if (resto) resultado.push({ texto: resto, insertado: false });
  return fusionarContiguos(resultado);
}

function fusionarContiguos(segmentos: SegmentoOracion[]): SegmentoOracion[] {
  const fusionados: SegmentoOracion[] = [];
  for (const segmento of segmentos) {
    const ultimo = fusionados[fusionados.length - 1];
    if (ultimo && ultimo.insertado === segmento.insertado && !segmento.insertado) {
      ultimo.texto += segmento.texto;
    } else {
      fusionados.push({ ...segmento });
    }
  }
  return fusionados;
}
