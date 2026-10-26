import type { ConfiguracionJuego, Pregunta } from '../contenido/esquemas';
import type { Aleatorio } from './aleatorio';
import { estadoInicial, reducir, type Accion, type Contexto, type EstadoPartida } from './maquina';
import { segundosDePregunta } from './premios';
import { crearTemporizador } from './temporizador';

export interface OpcionesControlador {
  juego: ConfiguracionJuego;
  banco: readonly Pregunta[];
  aleatorio: Aleatorio;
  ahora?: () => number;
  /** Cada evento de la partida, para el modo `?debug`. */
  alRegistrar?: (mensaje: string) => void;
}

export interface Controlador {
  estado(): EstadoPartida;
  segundosRestantes(): number;
  suscribir(oyente: (estado: EstadoPartida, segundos: number) => void): () => void;
  despachar(accion: Accion): void;
  /** Cancela todo lo pendiente (al desmontar la aplicación). */
  destruir(): void;
}

type EfectoPendiente = { clave: string; manejador: ReturnType<typeof setTimeout> };

/**
 * Conecta la máquina de estados con el tiempo: temporizador de la pregunta y pausas de
 * suspenso, revelación y público. Es el único lugar de la lógica con efectos.
 */
export function crearControlador(opciones: OpcionesControlador): Controlador {
  const { juego, banco, aleatorio, alRegistrar } = opciones;
  const contexto: Contexto = { juego, banco, aleatorio };
  const oyentes = new Set<(estado: EstadoPartida, segundos: number) => void>();

  let estado = estadoInicial();
  let segundos = 0;
  let pendiente: EfectoPendiente | undefined;
  let turnoDelTemporizador = -1;

  const notificar = () => oyentes.forEach((oyente) => oyente(estado, segundos));

  const temporizador = crearTemporizador({
    ahora: opciones.ahora,
    alTic: (restantes) => {
      segundos = restantes;
      notificar();
    },
    alAgotarse: () => despachar({ tipo: 'tiempoAgotado', turno: turnoDelTemporizador }),
  });

  function programar(clave: string, ms: number, accion: Accion) {
    if (pendiente?.clave === clave) return;
    cancelarPendiente();
    pendiente = { clave, manejador: setTimeout(() => despachar(accion), ms) };
  }

  function cancelarPendiente() {
    if (pendiente) clearTimeout(pendiente.manejador);
    pendiente = undefined;
  }

  /** Ajusta temporizadores y pausas a lo que pide el estado nuevo. */
  function sincronizarEfectos(anterior: EstadoPartida) {
    const { duracionesMs } = juego;
    const turno = estado.turno;

    // Practicando no hay tiempo ni suspenso: se contesta con calma y se ve el resultado enseguida.
    if (estado.fase === 'pregunta' && !estado.practica) {
      if (anterior.fase !== 'pregunta' || anterior.turno !== turno) {
        turnoDelTemporizador = turno;
        temporizador.iniciar(segundosDePregunta(juego, estado.numeroPregunta));
      } else if (estado.publicoEnCurso && !anterior.publicoEnCurso) {
        temporizador.pausar();
      } else if (!estado.publicoEnCurso && anterior.publicoEnCurso) {
        temporizador.reanudar();
      }
    } else {
      temporizador.detener();
    }

    if (estado.fase === 'suspenso') {
      programar(`suspenso:${turno}`, estado.practica ? 0 : duracionesMs.suspenso, {
        tipo: 'finSuspenso',
      });
    } else if (estado.fase === 'revelacion') {
      programar(`revelacion:${turno}`, duracionesMs.antesDeResultado, { tipo: 'verResultado' });
    } else if (estado.fase === 'pregunta' && estado.publicoEnCurso) {
      programar(`publico:${turno}`, duracionesMs.barrasPublico, { tipo: 'publicoTerminado' });
    } else {
      cancelarPendiente();
    }
  }

  function despachar(accion: Accion) {
    const anterior = estado;
    estado = reducir(estado, accion, contexto);
    if (estado === anterior) {
      alRegistrar?.(`${accion.tipo}: ignorada en la fase ${anterior.fase}`);
      return;
    }
    alRegistrar?.(`${accion.tipo}: ${anterior.fase} → ${estado.fase} (turno ${estado.turno})`);
    sincronizarEfectos(anterior);
    notificar();
  }

  return {
    estado: () => estado,
    segundosRestantes: () => segundos,
    suscribir(oyente) {
      oyentes.add(oyente);
      oyente(estado, segundos);
      return () => oyentes.delete(oyente);
    },
    despachar,
    destruir() {
      cancelarPendiente();
      temporizador.detener();
      oyentes.clear();
    },
  };
}
