import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import { crearControlador, type Controlador } from '@motor/juego/controlador';
import { crearRelojPausable } from '@motor/juego/relojPausable';
import { estadoInicial, reducir, sePuedePausar } from '@motor/juego/maquina';
import type { Reproductor } from '@motor/sonidos/reproductor';
import {
  aplicar,
  banco,
  comenzar,
  crearContexto,
  juegoPlantilla,
  suspensoTotalMs,
  todosLosTemas,
} from './ayudas';

const { suspensoSonando, antesDeResultado, barrasPublico } = juegoPlantilla.duracionesMs;

function crear() {
  const llamadas: string[] = [];
  const reproductor: Reproductor = {
    activar() {},
    reproducir: (nombre) => llamadas.push(`suena:${nombre}`),
    detenerTodo: () => llamadas.push('detenerTodo'),
    pausar: () => llamadas.push('pausar'),
    reanudar: () => llamadas.push('reanudar'),
    destruir() {},
  };
  const controlador = crearControlador({
    juego: juegoPlantilla,
    banco: banco.preguntas,
    aleatorio: crearAleatorio(5),
    reproductor,
  });
  controlador.despachar({ tipo: 'comenzar', temasElegidos: todosLosTemas() });
  return { controlador, llamadas };
}

const responder = (c: Controlador) =>
  c.despachar({ tipo: 'responder', opcion: c.estado().preguntaActual!.correcta });

describe('reloj pausable', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('una tarea pausada conserva exactamente lo que le faltaba', () => {
    const reloj = crearRelojPausable();
    const accion = vi.fn();
    reloj.programar(1000, accion);
    vi.advanceTimersByTime(400);
    reloj.pausar();
    vi.advanceTimersByTime(60_000);
    expect(accion).not.toHaveBeenCalled();
    reloj.reanudar();
    vi.advanceTimersByTime(599);
    expect(accion).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('una tarea programada con el reloj en pausa empieza al reanudar', () => {
    const reloj = crearRelojPausable();
    const accion = vi.fn();
    reloj.pausar();
    reloj.programar(500, accion);
    vi.advanceTimersByTime(10_000);
    expect(accion).not.toHaveBeenCalled();
    reloj.reanudar();
    vi.advanceTimersByTime(500);
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('pausar y reanudar varias veces no gana ni pierde tiempo', () => {
    const reloj = crearRelojPausable();
    const accion = vi.fn();
    reloj.programar(1000, accion);
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(150);
      reloj.pausar();
      vi.advanceTimersByTime(333);
      reloj.reanudar();
    }
    vi.advanceTimersByTime(249);
    expect(accion).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('cancelar una tarea pausada la elimina', () => {
    const reloj = crearRelojPausable();
    const accion = vi.fn();
    const id = reloj.programar(100, accion);
    reloj.pausar();
    reloj.cancelar(id);
    reloj.reanudar();
    vi.advanceTimersByTime(1000);
    expect(accion).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('máquina: pausar y reanudar', () => {
  it('se puede pausar durante la partida y no en las pantallas finales', () => {
    const contexto = crearContexto();
    expect(sePuedePausar(estadoInicial())).toBe(false);
    const enPregunta = comenzar(contexto);
    expect(sePuedePausar(enPregunta)).toBe(true);
    expect(sePuedePausar({ ...enPregunta, fase: 'derrota' })).toBe(false);
    expect(sePuedePausar({ ...enPregunta, fase: 'victoria' })).toBe(false);
  });

  it('en pausa se ignora todo salvo reanudar y nueva partida', () => {
    const contexto = crearContexto();
    const pausado = aplicar(comenzar(contexto), contexto, { tipo: 'pausar' });
    expect(pausado.pausada).toBe(true);
    const opcion = pausado.opcionesMostradas[0]!;
    for (const accion of [
      { tipo: 'responder', opcion },
      { tipo: 'usarCincuenta' },
      { tipo: 'usarPublico' },
      { tipo: 'usarCambiar' },
      { tipo: 'siguiente' },
      { tipo: 'finSuspenso' },
      { tipo: 'verResultado' },
    ] as const) {
      expect(reducir(pausado, accion, contexto)).toBe(pausado);
    }
    expect(reducir(pausado, { tipo: 'reanudar' }, contexto).pausada).toBe(false);
    expect(reducir(pausado, { tipo: 'nuevaPartida' }, contexto).fase).toBe('inicio');
  });

  it('pausar fuera de lugar se ignora', () => {
    const contexto = crearContexto();
    const inicio = estadoInicial();
    expect(reducir(inicio, { tipo: 'pausar' }, contexto)).toBe(inicio);
    expect(reducir(inicio, { tipo: 'reanudar' }, contexto)).toBe(inicio);
  });
});

describe('controlador en pausa', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('pausar a mitad de la pregunta no cambia el tiempo restante y al reanudar sigue de ahí', () => {
    const { controlador } = crear();
    const total = controlador.segundosRestantes();
    vi.advanceTimersByTime(3_500);
    const antes = controlador.segundosRestantes();
    expect(antes).toBe(total - 3);
    controlador.despachar({ tipo: 'pausar' });
    vi.advanceTimersByTime(120_000);
    expect(controlador.segundosRestantes()).toBe(antes);
    expect(controlador.estado().fase).toBe('pregunta');
    controlador.despachar({ tipo: 'reanudar' });
    vi.advanceTimersByTime(antes * 1000 - 500 - 1);
    expect(controlador.estado().fase).toBe('pregunta');
    vi.advanceTimersByTime(100);
    expect(controlador.estado()).toMatchObject({ fase: 'resultado', motivoFin: 'tiempo' });
    controlador.destruir();
  });

  it('pausar en medio del suspenso retrasa la revelación lo que duró la pausa', () => {
    const { controlador } = crear();
    responder(controlador);
    vi.advanceTimersByTime(1_000);
    controlador.despachar({ tipo: 'pausar' });
    vi.advanceTimersByTime(30_000);
    expect(controlador.estado().fase).toBe('suspenso');
    controlador.despachar({ tipo: 'reanudar' });
    vi.advanceTimersByTime(suspensoTotalMs - 1_000 - 1);
    expect(controlador.estado().fase).toBe('suspenso');
    vi.advanceTimersByTime(1);
    expect(controlador.estado().fase).toBe('revelacion');
    controlador.destruir();
  });

  it('pausar durante el silencio final conserva el estado fijo y lo que falta', () => {
    const { controlador } = crear();
    responder(controlador);
    vi.advanceTimersByTime(suspensoSonando + 100);
    expect(controlador.estado().suspensoEnSilencio).toBe(true);
    controlador.despachar({ tipo: 'pausar' });
    vi.advanceTimersByTime(30_000);
    expect(controlador.estado()).toMatchObject({ fase: 'suspenso', suspensoEnSilencio: true });
    controlador.despachar({ tipo: 'reanudar' });
    vi.advanceTimersByTime(suspensoTotalMs - suspensoSonando - 100 - 1);
    expect(controlador.estado().fase).toBe('suspenso');
    vi.advanceTimersByTime(1);
    expect(controlador.estado().fase).toBe('revelacion');
    controlador.destruir();
  });

  it('pausar durante la revelación retrasa el paso al resultado', () => {
    const { controlador } = crear();
    responder(controlador);
    vi.advanceTimersByTime(suspensoTotalMs + 300);
    expect(controlador.estado().fase).toBe('revelacion');
    controlador.despachar({ tipo: 'pausar' });
    vi.advanceTimersByTime(30_000);
    expect(controlador.estado().fase).toBe('revelacion');
    controlador.despachar({ tipo: 'reanudar' });
    vi.advanceTimersByTime(antesDeResultado - 300 - 1);
    expect(controlador.estado().fase).toBe('revelacion');
    vi.advanceTimersByTime(1);
    expect(controlador.estado().fase).toBe('resultado');
    controlador.destruir();
  });

  it('pausar con el público en curso: las barras terminan tras lo que faltaba y el tiempo sigue después', () => {
    const { controlador } = crear();
    controlador.despachar({ tipo: 'usarPublico' });
    expect(controlador.estado().publicoEnCurso).toBe(true);
    const segundos = controlador.segundosRestantes();
    vi.advanceTimersByTime(800);
    controlador.despachar({ tipo: 'pausar' });
    vi.advanceTimersByTime(30_000);
    controlador.despachar({ tipo: 'reanudar' });
    // El tiempo de la pregunta sigue detenido mientras el público no termine.
    vi.advanceTimersByTime(barrasPublico - 800 - 1);
    expect(controlador.estado().publicoEnCurso).toBe(true);
    expect(controlador.segundosRestantes()).toBe(segundos);
    vi.advanceTimersByTime(1);
    expect(controlador.estado().publicoEnCurso).toBe(false);
    vi.advanceTimersByTime(2_000);
    expect(controlador.segundosRestantes()).toBeLessThan(segundos);
    controlador.destruir();
  });

  it('con la pausa activa las acciones del jugador no hacen nada', () => {
    const { controlador } = crear();
    controlador.despachar({ tipo: 'pausar' });
    const estado = controlador.estado();
    responder(controlador);
    controlador.despachar({ tipo: 'usarCincuenta' });
    controlador.despachar({ tipo: 'siguiente' });
    expect(controlador.estado()).toBe(estado);
    controlador.destruir();
  });

  it('el audio se suspende al pausar y continúa al reanudar, sin cortarse', () => {
    const { controlador, llamadas } = crear();
    responder(controlador);
    llamadas.length = 0;
    controlador.despachar({ tipo: 'pausar' });
    controlador.despachar({ tipo: 'reanudar' });
    expect(llamadas).toEqual(['pausar', 'reanudar']);
    controlador.destruir();
  });

  it('nueva partida estando en pausa deja todo corriendo y limpio', () => {
    const { controlador } = crear();
    responder(controlador);
    controlador.despachar({ tipo: 'pausar' });
    controlador.despachar({ tipo: 'nuevaPartida' });
    expect(controlador.estado()).toMatchObject({ fase: 'inicio', pausada: false });
    controlador.despachar({ tipo: 'comenzar', temasElegidos: todosLosTemas() });
    vi.advanceTimersByTime(2_100);
    expect(controlador.segundosRestantes()).toBeLessThan(
      juegoPlantilla.segundosPorNivel['1'] as number,
    );
    controlador.destruir();
  });

  it('no queda nada pendiente al destruir en pausa', () => {
    const { controlador } = crear();
    responder(controlador);
    controlador.despachar({ tipo: 'pausar' });
    controlador.destruir();
    controlador.despachar({ tipo: 'reanudar' });
    vi.advanceTimersByTime(10_000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
