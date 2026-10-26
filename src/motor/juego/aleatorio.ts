export type Aleatorio = () => number;

/** Generador con semilla (mulberry32): misma semilla, misma secuencia. */
export function crearAleatorio(semilla: number): Aleatorio {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero entre `minimo` y `maximo`, ambos incluidos. */
export function enteroEntre(minimo: number, maximo: number, aleatorio: Aleatorio): number {
  return minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
}

export function elegirUno<T>(elementos: readonly T[], aleatorio: Aleatorio): T {
  if (elementos.length === 0) throw new Error('No se puede elegir de una lista vacía');
  return elementos[Math.floor(aleatorio() * elementos.length)]!;
}

export function barajar<T>(elementos: readonly T[], aleatorio: Aleatorio): T[] {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

/** Elige `cantidad` elementos distintos. */
export function elegirVarios<T>(
  elementos: readonly T[],
  cantidad: number,
  aleatorio: Aleatorio,
): T[] {
  return barajar(elementos, aleatorio).slice(0, cantidad);
}
