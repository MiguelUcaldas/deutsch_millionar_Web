import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import { crearControlador, type Controlador } from '@motor/juego/controlador';
import { parpadeosDeSuspenso } from '@motor/juego/suspenso';
import type { Reproductor } from '@motor/sonidos/reproductor';
import type { NombreSonido } from '@motor/sonidos/rutas';
import { banco, juegoPlantilla, suspensoTotalMs, todosLosTemas } from './ayudas';

const { suspensoSonando, suspensoSilencio, antesDeResultado } = juegoPlantilla.duracionesMs;

interface Toque {
  nombre: NombreSonido;
  /** Milisegundos desde el inicio de la prueba. */
  en: number;
  /** Lo que mostraba la interfaz en el instante exacto en que se pidió el sonido. */
  fase: string;
  segundos: number;
  suspensoEnSilencio: boolean;
}

function crear(practica = false) {
  const toques: Toque[] = [];
  const cortes: number[] = [];
  const inicio = Date.now();
  const ref: { controlador?: Controlador } = {};
  const reproductor: Reproductor = {
    activar() {},
    reproducir(nombre) {
      const estado = ref.controlador!.estado();
      toques.push({
        nombre,
        en: Date.now() - inicio,
        fase: estado.fase,
        segundos: ref.controlador!.segundosRestantes(),
        suspensoEnSilencio: estado.suspensoEnSilencio,
      });
    },
    detenerTodo: () => cortes.push(Date.now() - inicio),
    pausar() {},
    reanudar() {},
    destruir() {},
  };
  const controlador = crearControlador({
    juego: juegoPlantilla,
    banco: banco.preguntas,
    aleatorio: crearAleatorio(5),
    reproductor,
  });
  ref.controlador = controlador;
  if (practica) {
    const ids = banco.preguntas.slice(0, 3).map((p) => p.id);
    controlador.despachar({ tipo: 'comenzarPractica', titulo: 'Prueba', preguntas: ids });
  } else {
    controlador.despachar({ tipo: 'comenzar', temasElegidos: todosLosTemas() });
  }
  return { controlador, toques, cortes };
}

const responderCorrecta = (c: Controlador) =>
  c.despachar({ tipo: 'responder', opcion: c.estado().preguntaActual!.correcta });
const responderIncorrecta = (c: Controlador) =>
  c.despachar({
    tipo: 'responder',
    opcion: c.estado().opcionesMostradas.find((o) => o !== c.estado().preguntaActual!.correcta)!,
  });

describe('sonidos sincronizados con la interfaz', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('el tic suena cuando el contador baja, con el mismo número que se ve, y sin tic al empezar', () => {
    const { controlador, toques } = crear();
    expect(toques).toEqual([]);
    const total = controlador.segundosRestantes();
    vi.advanceTimersByTime(3_000);
    const tics = toques.filter((t) => t.nombre === 'tic');
    expect(tics.map((t) => t.segundos)).toEqual([total - 1, total - 2, total - 3]);
    expect(tics.every((t) => t.fase === 'pregunta')).toBe(true);
    controlador.destruir();
  });

  it('con segundosAlerta o menos suena el tic de alerta, y al llegar a 0 suena «incorrecto»', () => {
    const { controlador, toques } = crear();
    vi.advanceTimersByTime(controlador.segundosRestantes() * 1000 + 200);
    const alertas = toques.filter((t) => t.nombre === 'ticAlerta').map((t) => t.segundos);
    expect(alertas).toEqual(
      Array.from(
        { length: juegoPlantilla.segundosAlerta },
        (_, i) => juegoPlantilla.segundosAlerta - i,
      ).filter((s) => s > 0),
    );
    expect(
      toques
        .filter((t) => t.nombre === 'tic')
        .every((t) => t.segundos > juegoPlantilla.segundosAlerta),
    ).toBe(true);
    const ultimo = toques.at(-1)!;
    expect(ultimo).toMatchObject({ nombre: 'incorrecto', fase: 'resultado', segundos: 0 });
    // Ningún tic en el 0: lo reemplaza el sonido de tiempo agotado.
    expect(toques.filter((t) => t.segundos === 0 && t.nombre !== 'incorrecto')).toEqual([]);
    controlador.destruir();
  });

  it('el suspenso suena al elegir y la opción parpadea solo mientras suena', () => {
    const { controlador, toques } = crear();
    responderCorrecta(controlador);
    expect(toques.at(-1)).toMatchObject({
      nombre: 'suspenso',
      fase: 'suspenso',
      suspensoEnSilencio: false,
    });
    vi.advanceTimersByTime(suspensoSonando - 1);
    expect(controlador.estado().suspensoEnSilencio).toBe(false);
    vi.advanceTimersByTime(1);
    expect(controlador.estado()).toMatchObject({ fase: 'suspenso', suspensoEnSilencio: true });
    controlador.destruir();
  });

  it('la revelación llega exactamente a suspensoSonando + suspensoSilencio, con su sonido en ese tick', () => {
    for (const [responder, sonido] of [
      [responderCorrecta, 'correcto'],
      [responderIncorrecta, 'incorrecto'],
    ] as const) {
      const { controlador, toques } = crear();
      responder(controlador);
      const inicio = toques.at(-1)!.en;
      vi.advanceTimersByTime(suspensoTotal() - 1);
      expect(controlador.estado().fase).toBe('suspenso');
      expect(toques.some((t) => t.nombre === sonido)).toBe(false);
      vi.advanceTimersByTime(1);
      expect(controlador.estado().fase).toBe('revelacion');
      const toque = toques.at(-1)!;
      expect(toque).toMatchObject({ nombre: sonido, fase: 'revelacion' });
      expect(toque.en - inicio).toBe(suspensoSonando + suspensoSilencio);
      controlador.destruir();
    }
  });

  it('el sonido de la revelación no se corta al pasar al resultado ni al siguiente', () => {
    const { controlador, cortes } = crear();
    responderCorrecta(controlador);
    vi.advanceTimersByTime(suspensoTotal() + antesDeResultado + 1);
    expect(controlador.estado().fase).toBe('resultado');
    controlador.despachar({ tipo: 'siguiente' });
    expect(controlador.estado().fase).toBe('pregunta');
    expect(cortes).toEqual([]);
    controlador.destruir();
  });

  it('solo Cambiar, nueva partida y salir de la práctica cortan el audio', () => {
    const { controlador, cortes } = crear();
    controlador.despachar({ tipo: 'usarCambiar' });
    expect(cortes).toHaveLength(1);
    controlador.despachar({ tipo: 'nuevaPartida' });
    expect(cortes).toHaveLength(2);
    controlador.destruir();
    expect(cortes).toHaveLength(3);

    const practica = crear(true);
    practica.controlador.despachar({ tipo: 'terminarPractica' });
    expect(practica.cortes).toHaveLength(1);
    practica.controlador.destruir();
  });

  it('en la práctica no hay tic ni suspenso, pero sí correcto al revelar', () => {
    const { controlador, toques } = crear(true);
    vi.advanceTimersByTime(60_000);
    expect(toques).toEqual([]);
    responderCorrecta(controlador);
    vi.advanceTimersByTime(1);
    expect(toques.map((t) => t.nombre)).toEqual(['correcto']);
    expect(toques[0]).toMatchObject({ fase: 'revelacion' });
    controlador.destruir();
  });
});

function suspensoTotal() {
  return suspensoTotalMs;
}

describe('parpadeo del suspenso', () => {
  it('reparte lo que suena el suspenso en ciclos de unos 200 ms', () => {
    expect(parpadeosDeSuspenso(1800)).toEqual({ cantidad: 9, cicloMs: 200 });
    expect(parpadeosDeSuspenso(1900)).toEqual({ cantidad: 10, cicloMs: 190 });
  });

  it('los ciclos suman exactamente lo que suena, sea cual sea la duración', () => {
    for (const ms of [600, 1234, 1800, 2400]) {
      const { cantidad, cicloMs } = parpadeosDeSuspenso(ms);
      expect(cantidad * cicloMs).toBeCloseTo(ms, 6);
    }
  });

  it('el valor de la plantilla usa los mismos tiempos de la configuración', () => {
    expect(suspensoSilencio).toBeGreaterThanOrEqual(0);
    expect(parpadeosDeSuspenso(suspensoSonando).cantidad).toBeGreaterThan(0);
  });
});
