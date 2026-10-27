/** Duración que se busca para cada parpadeo de la opción elegida mientras suena el suspenso. */
const CICLO_OBJETIVO_MS = 200;

/**
 * El parpadeo de la opción dura exactamente lo que suena el suspenso: se reparte `suspensoSonando`
 * en ciclos enteros lo más cercanos a 200 ms. Así la animación nunca se desfasa del archivo.
 */
export function parpadeosDeSuspenso(suspensoSonandoMs: number): {
  cantidad: number;
  cicloMs: number;
} {
  const cantidad = Math.max(0, Math.round(suspensoSonandoMs / CICLO_OBJETIVO_MS));
  return {
    cantidad,
    cicloMs: cantidad === 0 ? CICLO_OBJETIVO_MS : suspensoSonandoMs / cantidad,
  };
}
