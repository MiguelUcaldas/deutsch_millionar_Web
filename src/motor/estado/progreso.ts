import { z } from 'zod';

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Repaso espaciado por cajas (Leitner): una pregunta fallada vuelve enseguida; cada acierto
 * posterior la espacia más. Días hasta la próxima revisión según la caja en la que está.
 */
export const INTERVALOS_EN_DIAS = [0, 1, 3, 7, 14] as const;
const ULTIMA_CAJA = INTERVALOS_EN_DIAS.length - 1;

const esquemaRegistroPregunta = z.object({
  fallos: z.number().int().min(0),
  aciertos: z.number().int().min(0),
  caja: z.number().int().min(0).max(ULTIMA_CAJA),
  /** Marca de tiempo (ms) desde la que toca volver a preguntarla. */
  proxima: z.number(),
});

export const esquemaProgreso = z.object({
  version: z.literal(1),
  partidas: z.number().int().min(0),
  victorias: z.number().int().min(0),
  /** Mayor cantidad de preguntas superadas en una partida. */
  mejorPregunta: z.number().int().min(0),
  mejorPremio: z.number().min(0),
  temas: z.record(
    z.string(),
    z.object({ aciertos: z.number().int().min(0), fallos: z.number().int().min(0) }),
  ),
  /** Solo las preguntas que alguna vez se fallaron. */
  preguntas: z.record(z.string(), esquemaRegistroPregunta),
});

export type Progreso = z.infer<typeof esquemaProgreso>;
export type RegistroPregunta = z.infer<typeof esquemaRegistroPregunta>;

export function progresoVacio(): Progreso {
  return {
    version: 1,
    partidas: 0,
    victorias: 0,
    mejorPregunta: 0,
    mejorPremio: 0,
    temas: {},
    preguntas: {},
  };
}

/** Lee un progreso guardado; si está dañado o es de otra versión, empieza de cero. */
export function leerProgreso(crudo: unknown): Progreso {
  const lectura = esquemaProgreso.safeParse(crudo);
  return lectura.success ? lectura.data : progresoVacio();
}

export function registrarRespuesta(
  progreso: Progreso,
  pregunta: { id: string; tema: string },
  acerto: boolean,
  ahora: number,
): Progreso {
  const tema = progreso.temas[pregunta.tema] ?? { aciertos: 0, fallos: 0 };
  const temas = {
    ...progreso.temas,
    [pregunta.tema]: {
      aciertos: tema.aciertos + (acerto ? 1 : 0),
      fallos: tema.fallos + (acerto ? 0 : 1),
    },
  };

  const previo = progreso.preguntas[pregunta.id];
  if (!acerto) {
    return {
      ...progreso,
      temas,
      preguntas: {
        ...progreso.preguntas,
        [pregunta.id]: {
          fallos: (previo?.fallos ?? 0) + 1,
          aciertos: previo?.aciertos ?? 0,
          caja: 0,
          proxima: ahora + INTERVALOS_EN_DIAS[0] * DIA_MS,
        },
      },
    };
  }
  // Acertar algo que nunca se falló no genera repaso.
  if (!previo) return { ...progreso, temas };
  const caja = Math.min(previo.caja + 1, ULTIMA_CAJA);
  return {
    ...progreso,
    temas,
    preguntas: {
      ...progreso.preguntas,
      [pregunta.id]: {
        ...previo,
        aciertos: previo.aciertos + 1,
        caja,
        proxima: ahora + INTERVALOS_EN_DIAS[caja]! * DIA_MS,
      },
    },
  };
}

export function registrarPartida(
  progreso: Progreso,
  resultado: { superadas: number; premio: number; victoria: boolean },
): Progreso {
  return {
    ...progreso,
    partidas: progreso.partidas + 1,
    victorias: progreso.victorias + (resultado.victoria ? 1 : 0),
    mejorPregunta: Math.max(progreso.mejorPregunta, resultado.superadas),
    mejorPremio: Math.max(progreso.mejorPremio, resultado.premio),
  };
}

/** Ids de las preguntas falladas que ya toca repasar, las más atrasadas primero. */
export function preguntasPendientes(progreso: Progreso, ahora: number): string[] {
  return Object.entries(progreso.preguntas)
    .filter(([, registro]) => registro.proxima <= ahora)
    .sort(([, a], [, b]) => a.proxima - b.proxima)
    .map(([id]) => id);
}

export interface TemaFallado {
  tema: string;
  aciertos: number;
  fallos: number;
  /** Proporción de respuestas falladas, de 0 a 1. */
  tasaDeFallo: number;
}

/** Temas con más proporción de fallos. Pide un mínimo de respuestas para no juzgar con una sola. */
export function temasMasFallados(
  progreso: Progreso,
  cantidad = 3,
  minimoRespuestas = 3,
): TemaFallado[] {
  return Object.entries(progreso.temas)
    .map(([tema, { aciertos, fallos }]) => ({
      tema,
      aciertos,
      fallos,
      tasaDeFallo: fallos / Math.max(1, aciertos + fallos),
    }))
    .filter((t) => t.aciertos + t.fallos >= minimoRespuestas && t.fallos > 0)
    .sort((a, b) => b.tasaDeFallo - a.tasaDeFallo || b.fallos - a.fallos)
    .slice(0, cantidad);
}

/** Ids de las preguntas con más fallos acumulados. */
export function preguntasMasFalladas(progreso: Progreso, cantidad = 5): string[] {
  return Object.entries(progreso.preguntas)
    .sort(([, a], [, b]) => b.fallos - a.fallos)
    .slice(0, cantidad)
    .map(([id]) => id);
}
