import type { ConfiguracionJuego, Pregunta } from '../contenido/esquemas';
import type { Aleatorio } from './aleatorio';
import { estadoInicial, reducir, type Accion, type Contexto, type EstadoPartida } from './maquina';
import { segundosDePregunta } from './premios';
import type { NombreSonido } from '../sonidos/rutas';
import type { Reproductor } from '../sonidos/reproductor';
import { crearRelojPausable, type RelojPausable } from './relojPausable';
import { crearTemporizador } from './temporizador';

export interface OpcionesControlador {
  juego: ConfiguracionJuego;
  banco: readonly Pregunta[];
  aleatorio: Aleatorio;
  ahora?: () => number;
  /** Reloj de los efectos; se comparte con quien también deba congelarse al pausar (p. ej. el aviso). */
  reloj?: RelojPausable;
  /** Suena en el mismo instante en que cambia lo que se ve; sin él, el juego es mudo. */
  reproductor?: Reproductor;
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

type EfectoPendiente = { clave: string; id: number };

/**
 * Conecta la máquina de estados con el tiempo: temporizador de la pregunta y pausas de
 * suspenso, revelación y público. Es el único lugar de la lógica con efectos.
 */
export function crearControlador(opciones: OpcionesControlador): Controlador {
  const { juego, banco, aleatorio, alRegistrar, reproductor } = opciones;
  const sonar = (nombre: NombreSonido) => reproductor?.reproducir(nombre);
  const reloj = opciones.reloj ?? crearRelojPausable(opciones.ahora);
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
      const anterior = segundos;
      segundos = restantes;
      // El tic suena con el número y la barra: solo cuando el contador baja (y no al llegar a 0,
      // donde suena «incorrecto»).
      if (restantes > 0 && restantes < anterior) {
        sonar(restantes <= juego.segundosAlerta ? 'ticAlerta' : 'tic');
      }
      notificar();
    },
    alAgotarse: () => despachar({ tipo: 'tiempoAgotado', turno: turnoDelTemporizador }),
  });

  function programar(clave: string, ms: number, accion: Accion) {
    if (pendiente?.clave === clave) return;
    cancelarPendiente();
    pendiente = { clave, id: reloj.programar(ms, () => despachar(accion)) };
  }

  function cancelarPendiente() {
    if (pendiente) reloj.cancelar(pendiente.id);
    pendiente = undefined;
  }

  /** Ajusta temporizadores y pausas a lo que pide el estado nuevo. */
  function sincronizarEfectos(anterior: EstadoPartida, accion: Accion) {
    const { duracionesMs } = juego;
    const turno = estado.turno;

    // Pausa: se congela todo donde está (tiempo de la pregunta, efectos pendientes y audio).
    if (!anterior.pausada && estado.pausada) {
      temporizador.pausar();
      reloj.pausar();
      reproductor?.pausar();
      return;
    }
    if (anterior.pausada && !estado.pausada) {
      reloj.reanudar();
      reproductor?.reanudar();
      // Si el tiempo estaba detenido por el público, lo reanuda el fin del público, no la pausa.
      if (estado.fase === 'pregunta' && !estado.practica && !estado.publicoEnCurso) {
        temporizador.reanudar();
      }
      if (accion.tipo === 'reanudar') return;
    }

    // Practicando no hay tiempo ni suspenso: se contesta con calma y se ve el resultado enseguida.
    if (estado.fase === 'pregunta' && !estado.practica) {
      if (anterior.fase !== 'pregunta' || anterior.turno !== turno) {
        turnoDelTemporizador = turno;
        segundos = 0; // el primer valor del contador no es una bajada: no suena tic
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
      if (estado.practica) {
        programar(`suspenso:${turno}`, 0, { tipo: 'finSuspenso' });
      } else if (estado.suspensoEnSilencio) {
        programar(`silencio:${turno}`, duracionesMs.suspensoSilencio, { tipo: 'finSuspenso' });
      } else {
        if (anterior.fase !== 'suspenso') sonar('suspenso');
        programar(`suspenso:${turno}`, duracionesMs.suspensoSonando, {
          tipo: 'suspensoEnSilencio',
        });
      }
    } else if (estado.fase === 'revelacion') {
      if (anterior.fase !== 'revelacion') sonar(estado.acerto ? 'correcto' : 'incorrecto');
      programar(`revelacion:${turno}`, duracionesMs.antesDeResultado, { tipo: 'verResultado' });
    } else if (estado.fase === 'pregunta' && estado.publicoEnCurso) {
      programar(`publico:${turno}`, duracionesMs.barrasPublico, { tipo: 'publicoTerminado' });
    } else {
      cancelarPendiente();
    }

    // Tiempo agotado: «incorrecto» suena en el mismo instante en que el contador llega a 0.
    if (accion.tipo === 'tiempoAgotado') sonar('incorrecto');
    // Solo estos momentos cortan el audio; entre preguntas y hacia el resultado los sonidos terminan solos.
    const cambioPregunta = accion.tipo === 'usarCambiar' && anterior.turno !== estado.turno;
    if (cambioPregunta || accion.tipo === 'nuevaPartida' || accion.tipo === 'terminarPractica') {
      reproductor?.detenerTodo();
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
    sincronizarEfectos(anterior, accion);
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
      reproductor?.detenerTodo();
      oyentes.clear();
    },
  };
}
