import type { ConfiguracionJuego, Moneda } from '../contenido/esquemas';

/** La cantidad de preguntas de la partida sale de la cantidad de premios. */
export function totalPreguntas(juego: ConfiguracionJuego): number {
  return juego.premios.length;
}

/** Premio de la pregunta `numero` (empieza en 1). */
export function premioDePregunta(juego: ConfiguracionJuego, numero: number): number {
  return juego.premios[numero - 1] ?? 0;
}

export function nivelDePregunta(juego: ConfiguracionJuego, numero: number): number {
  return juego.nivelPorPregunta[numero - 1]!;
}

/** El tiempo depende del número de pregunta, no del nivel real de la pregunta sorteada. */
export function segundosDePregunta(juego: ConfiguracionJuego, numero: number): number {
  return juego.segundosPorNivel[String(nivelDePregunta(juego, numero))]!;
}

export function esPreguntaSegura(juego: ConfiguracionJuego, numero: number): boolean {
  return juego.preguntasSeguras.includes(numero);
}

/** Primera pregunta segura posterior a `numero`, o null si ya no quedan. */
export function proximaSegura(juego: ConfiguracionJuego, numero: number): number | null {
  const siguientes = juego.preguntasSeguras.filter((n) => n > numero).sort((a, b) => a - b);
  return siguientes[0] ?? null;
}

export function formatearDinero(moneda: Moneda, cantidad: number): string {
  const cifra = String(Math.trunc(cantidad)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    moneda.separadorMiles,
  );
  return moneda.simboloAntes ? `${moneda.simbolo} ${cifra}` : `${cifra} ${moneda.simbolo}`;
}
