export interface RelojPausable {
  /** Como `setTimeout`, pero el tiempo que falta se congela mientras el reloj está en pausa. */
  programar(ms: number, accion: () => void): number;
  cancelar(id: number): void;
  pausar(): void;
  /** Cada tarea sigue exactamente con lo que le faltaba. */
  reanudar(): void;
  readonly pausado: boolean;
}

interface Tarea {
  restanteMs: number;
  arranque: number;
  manejador?: ReturnType<typeof setTimeout>;
  accion: () => void;
}

/**
 * Todos los temporizadores del juego (suspenso, silencio, pausa antes del resultado, aviso...) pasan
 * por aquí para que una sola pausa los congele a la vez y la reanudación no gane ni pierda tiempo.
 */
export function crearRelojPausable(ahora: () => number = () => performance.now()): RelojPausable {
  const tareas = new Map<number, Tarea>();
  let siguienteId = 1;
  let pausado = false;

  function lanzar(id: number, tarea: Tarea) {
    tarea.arranque = ahora();
    tarea.manejador = setTimeout(() => {
      tareas.delete(id);
      tarea.accion();
    }, tarea.restanteMs);
  }

  return {
    programar(ms, accion) {
      const id = siguienteId++;
      const tarea: Tarea = { restanteMs: ms, arranque: 0, accion };
      tareas.set(id, tarea);
      if (!pausado) lanzar(id, tarea);
      return id;
    },
    cancelar(id) {
      const tarea = tareas.get(id);
      if (tarea) clearTimeout(tarea.manejador);
      tareas.delete(id);
    },
    pausar() {
      if (pausado) return;
      pausado = true;
      const instante = ahora();
      for (const tarea of tareas.values()) {
        clearTimeout(tarea.manejador);
        tarea.manejador = undefined;
        tarea.restanteMs = Math.max(0, tarea.restanteMs - (instante - tarea.arranque));
      }
    },
    reanudar() {
      if (!pausado) return;
      pausado = false;
      for (const [id, tarea] of tareas) lanzar(id, tarea);
    },
    get pausado() {
      return pausado;
    },
  };
}
