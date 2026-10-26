import type { ConfiguracionJuego, Pregunta } from '../contenido/esquemas';
import { barajar, type Aleatorio } from './aleatorio';
import { aplicarCincuenta, buscarReemplazo, calcularPublico, type Comodin } from './comodines';
import { esPreguntaSegura, nivelDePregunta, premioDePregunta, totalPreguntas } from './premios';
import { calcularMaximoPorTema, elegirPregunta, type ReglasSeleccion } from './seleccion';

export type Fase =
  | 'inicio'
  | 'pregunta'
  | 'suspenso'
  | 'revelacion'
  | 'resultado'
  | 'victoria'
  | 'derrota'
  | 'finPractica'
  | 'error';

export type MotivoFin = 'incorrecta' | 'tiempo';

/** Práctica: preguntas de un tema (o de lo fallado) sin dinero, tiempo ni comodines. */
export interface Practica {
  titulo: string;
  /** Ids de las preguntas, en el orden en que se presentan. */
  cola: string[];
  aciertos: number;
  respondidas: number;
}

export interface EstadoPartida {
  fase: Fase;
  temasElegidos: string[];
  numeroPregunta: number;
  preguntaActual: Pregunta | null;
  /** Opciones en el orden en que se muestran. */
  opcionesMostradas: string[];
  opcionesEliminadas: string[];
  comodinesUsados: Comodin[];
  preguntasUsadas: string[];
  temasUsados: Record<string, number>;
  temaAnterior: string | null;
  premioAsegurado: number;
  opcionElegida: string | null;
  acerto: boolean | null;
  motivoFin: MotivoFin | null;
  /** Sube cada vez que se asigna una pregunta; invalida avisos de tiempo de preguntas anteriores. */
  turno: number;
  porcentajesPublico: Record<string, number> | null;
  /** Mientras las barras del público crecen: el tiempo está en pausa y no se acepta nada. */
  publicoEnCurso: boolean;
  mensajeError: string | null;
  /** Distinto de null cuando se está practicando; entonces numeroPregunta es la posición en la cola. */
  practica: Practica | null;
}

export type Accion =
  | { tipo: 'comenzar'; temasElegidos: string[] }
  | { tipo: 'responder'; opcion: string }
  | { tipo: 'tiempoAgotado'; turno: number }
  | { tipo: 'usarCincuenta' }
  | { tipo: 'usarPublico' }
  | { tipo: 'publicoTerminado' }
  | { tipo: 'usarCambiar' }
  | { tipo: 'finSuspenso' }
  | { tipo: 'verResultado' }
  | { tipo: 'siguiente' }
  | { tipo: 'comenzarPractica'; titulo: string; preguntas: string[] }
  | { tipo: 'terminarPractica' }
  | { tipo: 'nuevaPartida' };

export interface Contexto {
  juego: ConfiguracionJuego;
  banco: readonly Pregunta[];
  aleatorio: Aleatorio;
}

export function estadoInicial(): EstadoPartida {
  return {
    fase: 'inicio',
    temasElegidos: [],
    numeroPregunta: 0,
    preguntaActual: null,
    opcionesMostradas: [],
    opcionesEliminadas: [],
    comodinesUsados: [],
    preguntasUsadas: [],
    temasUsados: {},
    temaAnterior: null,
    premioAsegurado: 0,
    opcionElegida: null,
    acerto: null,
    motivoFin: null,
    turno: 0,
    porcentajesPublico: null,
    publicoEnCurso: false,
    mensajeError: null,
    practica: null,
  };
}

/** Preguntas del banco que pertenecen a los temas elegidos. */
export function bancoDeTemas(banco: readonly Pregunta[], temas: readonly string[]): Pregunta[] {
  return banco.filter((pregunta) => temas.includes(pregunta.tema));
}

function reglasDeSeleccion(contexto: Contexto, temas: readonly string[]): ReglasSeleccion {
  const niveles = contexto.juego.nivelPorPregunta;
  return {
    maximoPorTema: calcularMaximoPorTema(
      contexto.juego.maximoBasePorTema,
      totalPreguntas(contexto.juego),
      Math.max(1, temas.length),
    ),
    unSoloTema: temas.length === 1,
    nivelMinimo: Math.min(...niveles),
    nivelMaximo: Math.max(...niveles),
  };
}

function conError(estado: EstadoPartida, mensaje: string): EstadoPartida {
  return { ...estado, fase: 'error', mensajeError: mensaje };
}

/** Pone `pregunta` como la actual y reinicia todo lo que depende de ella. */
function asignarPregunta(
  estado: EstadoPartida,
  pregunta: Pregunta,
  contexto: Contexto,
): EstadoPartida {
  return {
    ...estado,
    preguntaActual: pregunta,
    preguntasUsadas: [...estado.preguntasUsadas, pregunta.id],
    temasUsados: {
      ...estado.temasUsados,
      [pregunta.tema]: (estado.temasUsados[pregunta.tema] ?? 0) + 1,
    },
    temaAnterior: pregunta.tema,
    opcionesMostradas: pregunta.mantener_orden
      ? [...pregunta.opciones]
      : barajar(pregunta.opciones, contexto.aleatorio),
    opcionesEliminadas: [],
    opcionElegida: null,
    acerto: null,
    motivoFin: null,
    porcentajesPublico: null,
    publicoEnCurso: false,
    turno: estado.turno + 1,
  };
}

function pasarALaPregunta(
  estado: EstadoPartida,
  numero: number,
  contexto: Contexto,
): EstadoPartida {
  const banco = bancoDeTemas(contexto.banco, estado.temasElegidos);
  const pregunta = elegirPregunta(
    banco,
    estado,
    reglasDeSeleccion(contexto, estado.temasElegidos),
    nivelDePregunta(contexto.juego, numero),
    contexto.aleatorio,
  );
  if (!pregunta) return conError(estado, 'No hay preguntas disponibles para continuar la partida');
  return {
    ...asignarPregunta({ ...estado, numeroPregunta: numero }, pregunta, contexto),
    fase: 'pregunta',
  };
}

function pasarAPractica(estado: EstadoPartida, indice: number, contexto: Contexto): EstadoPartida {
  const id = estado.practica?.cola[indice];
  const pregunta = contexto.banco.find((p) => p.id === id);
  if (!pregunta) return conError(estado, 'No se encontró la pregunta de la práctica');
  return {
    ...asignarPregunta({ ...estado, numeroPregunta: indice + 1 }, pregunta, contexto),
    fase: 'pregunta',
  };
}

function comodinDisponible(estado: EstadoPartida, comodin: Comodin, contexto: Contexto): boolean {
  return (
    estado.practica === null &&
    estado.fase === 'pregunta' &&
    !estado.publicoEnCurso &&
    contexto.juego.comodines[comodin] &&
    !estado.comodinesUsados.includes(comodin)
  );
}

/** Aplica una acción. Las acciones que no corresponden al momento actual se ignoran. */
export function reducir(estado: EstadoPartida, accion: Accion, contexto: Contexto): EstadoPartida {
  switch (accion.tipo) {
    case 'comenzar': {
      if (estado.fase !== 'inicio') return estado;
      const temas = [...new Set(accion.temasElegidos)];
      if (temas.length === 0) return conError(estado, 'No hay temas elegidos');
      return pasarALaPregunta({ ...estadoInicial(), temasElegidos: temas }, 1, contexto);
    }

    case 'responder': {
      if (estado.fase !== 'pregunta' || estado.publicoEnCurso || !estado.preguntaActual)
        return estado;
      if (!estado.opcionesMostradas.includes(accion.opcion)) return estado;
      if (estado.opcionesEliminadas.includes(accion.opcion)) return estado;
      return {
        ...estado,
        fase: 'suspenso',
        opcionElegida: accion.opcion,
        acerto: accion.opcion === estado.preguntaActual.correcta,
      };
    }

    case 'tiempoAgotado': {
      if (estado.practica || estado.fase !== 'pregunta' || accion.turno !== estado.turno) {
        return estado;
      }
      return {
        ...estado,
        fase: 'resultado',
        opcionElegida: null,
        acerto: false,
        motivoFin: 'tiempo',
        publicoEnCurso: false,
      };
    }

    case 'finSuspenso': {
      if (estado.fase !== 'suspenso') return estado;
      const asegura =
        estado.acerto === true && esPreguntaSegura(contexto.juego, estado.numeroPregunta);
      return {
        ...estado,
        fase: 'revelacion',
        motivoFin: estado.acerto ? null : 'incorrecta',
        premioAsegurado: asegura
          ? premioDePregunta(contexto.juego, estado.numeroPregunta)
          : estado.premioAsegurado,
        practica: estado.practica
          ? {
              ...estado.practica,
              aciertos: estado.practica.aciertos + (estado.acerto ? 1 : 0),
              respondidas: estado.practica.respondidas + 1,
            }
          : null,
      };
    }

    case 'verResultado':
      return estado.fase === 'revelacion' ? { ...estado, fase: 'resultado' } : estado;

    case 'siguiente': {
      if (estado.fase !== 'resultado') return estado;
      if (estado.practica) {
        return estado.numeroPregunta >= estado.practica.cola.length
          ? { ...estado, fase: 'finPractica' }
          : pasarAPractica(estado, estado.numeroPregunta, contexto);
      }
      if (!estado.acerto) return { ...estado, fase: 'derrota' };
      if (estado.numeroPregunta >= totalPreguntas(contexto.juego))
        return { ...estado, fase: 'victoria' };
      return pasarALaPregunta(estado, estado.numeroPregunta + 1, contexto);
    }

    case 'usarCincuenta': {
      if (!comodinDisponible(estado, 'cincuentaCincuenta', contexto) || !estado.preguntaActual) {
        return estado;
      }
      return {
        ...estado,
        opcionesEliminadas: [
          ...estado.opcionesEliminadas,
          ...aplicarCincuenta(estado.preguntaActual, contexto.aleatorio),
        ],
        comodinesUsados: [...estado.comodinesUsados, 'cincuentaCincuenta'],
      };
    }

    case 'usarPublico': {
      if (!comodinDisponible(estado, 'publico', contexto) || !estado.preguntaActual) return estado;
      return {
        ...estado,
        porcentajesPublico: calcularPublico(
          estado.preguntaActual,
          estado.opcionesEliminadas,
          contexto.juego.rangosPublico,
          contexto.aleatorio,
        ),
        publicoEnCurso: true,
        comodinesUsados: [...estado.comodinesUsados, 'publico'],
      };
    }

    case 'publicoTerminado':
      return estado.publicoEnCurso ? { ...estado, publicoEnCurso: false } : estado;

    case 'usarCambiar': {
      if (!comodinDisponible(estado, 'cambiar', contexto) || !estado.preguntaActual) return estado;
      const reemplazo = buscarReemplazo(
        bancoDeTemas(contexto.banco, estado.temasElegidos),
        estado.preguntaActual,
        estado,
        contexto.aleatorio,
      );
      // Sin reemplazo el comodín no se gasta.
      if (!reemplazo) return estado;
      return {
        ...asignarPregunta(estado, reemplazo, contexto),
        comodinesUsados: [...estado.comodinesUsados, 'cambiar'],
      };
    }

    case 'comenzarPractica': {
      if (estado.fase !== 'inicio') return estado;
      if (accion.preguntas.length === 0) return conError(estado, 'No hay preguntas para practicar');
      const practica = {
        titulo: accion.titulo,
        cola: accion.preguntas,
        aciertos: 0,
        respondidas: 0,
      };
      return pasarAPractica({ ...estadoInicial(), practica }, 0, contexto);
    }

    case 'terminarPractica':
      return estado.practica && estado.fase !== 'finPractica' && estado.fase !== 'inicio'
        ? { ...estado, fase: 'finPractica' }
        : estado;

    case 'nuevaPartida':
      return estadoInicial();
  }
}

/** Premio que se lleva el jugador al terminar: el último asegurado, o el máximo si ganó. */
export function premioObtenido(estado: EstadoPartida, juego: ConfiguracionJuego): number {
  if (estado.fase === 'victoria') return premioDePregunta(juego, totalPreguntas(juego));
  return estado.premioAsegurado;
}
