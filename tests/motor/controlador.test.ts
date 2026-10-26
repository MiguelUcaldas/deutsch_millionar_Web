import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import { crearControlador } from '@motor/juego/controlador';
import { premioObtenido } from '@motor/juego/maquina';
import { segundosDePregunta } from '@motor/juego/premios';
import { banco, juegoPlantilla, todosLosTemas } from './ayudas';

const { duracionesMs } = juegoPlantilla;

function crear() {
  const controlador = crearControlador({
    juego: juegoPlantilla,
    banco: banco.preguntas,
    aleatorio: crearAleatorio(5),
  });
  controlador.despachar({ tipo: 'comenzar', temasElegidos: todosLosTemas() });
  return controlador;
}

describe('controlador', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('arranca el tiempo con los segundos del número de pregunta', () => {
    const controlador = crear();
    expect(controlador.segundosRestantes()).toBe(segundosDePregunta(juegoPlantilla, 1));
    controlador.destruir();
  });

  it('responder: suspenso → revelación → resultado con las pausas configuradas', () => {
    const controlador = crear();
    controlador.despachar({
      tipo: 'responder',
      opcion: controlador.estado().preguntaActual!.correcta,
    });
    expect(controlador.estado().fase).toBe('suspenso');
    vi.advanceTimersByTime(duracionesMs.suspenso - 1);
    expect(controlador.estado().fase).toBe('suspenso');
    vi.advanceTimersByTime(2);
    expect(controlador.estado().fase).toBe('revelacion');
    vi.advanceTimersByTime(duracionesMs.antesDeResultado + 1);
    expect(controlador.estado().fase).toBe('resultado');
    controlador.destruir();
  });

  it('el tiempo no sigue corriendo durante el suspenso', () => {
    const controlador = crear();
    controlador.despachar({
      tipo: 'responder',
      opcion: controlador.estado().preguntaActual!.correcta,
    });
    vi.advanceTimersByTime(60_000);
    expect(controlador.estado().fase).toBe('resultado');
    expect(controlador.estado().motivoFin).toBeNull();
    controlador.destruir();
  });

  it('al agotarse el tiempo la partida pasa al resultado con motivo «tiempo»', () => {
    const controlador = crear();
    vi.advanceTimersByTime(segundosDePregunta(juegoPlantilla, 1) * 1000 + 50);
    expect(controlador.estado().fase).toBe('resultado');
    expect(controlador.estado().motivoFin).toBe('tiempo');
    controlador.despachar({ tipo: 'siguiente' });
    expect(controlador.estado().fase).toBe('derrota');
    controlador.destruir();
  });

  it('el público pausa el tiempo y lo reanuda al terminar las barras', () => {
    const controlador = crear();
    vi.advanceTimersByTime(5000);
    const antes = controlador.segundosRestantes();
    controlador.despachar({ tipo: 'usarPublico' });
    vi.advanceTimersByTime(duracionesMs.barrasPublico - 100);
    expect(controlador.estado().publicoEnCurso).toBe(true);
    vi.advanceTimersByTime(200);
    expect(controlador.estado().publicoEnCurso).toBe(false);
    expect(controlador.segundosRestantes()).toBe(antes);
    vi.advanceTimersByTime(1100);
    expect(controlador.segundosRestantes()).toBeLessThan(antes);
    controlador.destruir();
  });

  it('cambiar reinicia el tiempo completo', () => {
    const controlador = crear();
    vi.advanceTimersByTime(20_000);
    const antes = controlador.segundosRestantes();
    controlador.despachar({ tipo: 'usarCambiar' });
    expect(controlador.segundosRestantes()).toBeGreaterThan(antes);
    expect(controlador.segundosRestantes()).toBe(segundosDePregunta(juegoPlantilla, 1));
    controlador.destruir();
  });

  it('juega una partida completa solo con el paso del tiempo', () => {
    const controlador = crear();
    while (controlador.estado().fase === 'pregunta') {
      controlador.despachar({
        tipo: 'responder',
        opcion: controlador.estado().preguntaActual!.correcta,
      });
      vi.advanceTimersByTime(duracionesMs.suspenso + duracionesMs.antesDeResultado + 10);
      controlador.despachar({ tipo: 'siguiente' });
    }
    expect(controlador.estado().fase).toBe('victoria');
    expect(premioObtenido(controlador.estado(), juegoPlantilla)).toBe(
      juegoPlantilla.premios.at(-1),
    );
    controlador.destruir();
  });

  it('no queda nada pendiente después de destruir', () => {
    const controlador = crear();
    controlador.despachar({
      tipo: 'responder',
      opcion: controlador.estado().preguntaActual!.correcta,
    });
    controlador.destruir();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('avisa a los suscriptores y permite darse de baja', () => {
    const controlador = crear();
    const fases: string[] = [];
    const baja = controlador.suscribir((estado) => fases.push(estado.fase));
    controlador.despachar({
      tipo: 'responder',
      opcion: controlador.estado().preguntaActual!.correcta,
    });
    baja();
    vi.advanceTimersByTime(10_000);
    expect(fases[0]).toBe('pregunta');
    expect(fases).toContain('suspenso');
    expect(fases).not.toContain('resultado');
    controlador.destruir();
  });
});
