import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearTemporizador } from '@motor/juego/temporizador';

describe('temporizador', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function crear() {
    const tics: number[] = [];
    let agotado = 0;
    const temporizador = crearTemporizador({
      alTic: (s) => tics.push(s),
      alAgotarse: () => agotado++,
    });
    return { temporizador, tics, agotados: () => agotado };
  }

  it('cuenta hacia atrás por segundos enteros y avisa al agotarse una sola vez', () => {
    const { temporizador, tics, agotados } = crear();
    temporizador.iniciar(3);
    expect(tics).toEqual([3]);
    vi.advanceTimersByTime(1100);
    expect(tics.at(-1)).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(tics.at(-1)).toBe(1);
    expect(agotados()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(tics.at(-1)).toBe(0);
    expect(agotados()).toBe(1);
    vi.advanceTimersByTime(10_000);
    expect(agotados()).toBe(1);
  });

  it('no repite el mismo segundo', () => {
    const { temporizador, tics } = crear();
    temporizador.iniciar(5);
    vi.advanceTimersByTime(5000);
    expect(new Set(tics).size).toBe(tics.length);
  });

  it('pausa y reanuda sin perder ni ganar tiempo', () => {
    const { temporizador, agotados } = crear();
    temporizador.iniciar(10);
    vi.advanceTimersByTime(4000);
    temporizador.pausar();
    expect(temporizador.segundosRestantes()).toBe(6);
    vi.advanceTimersByTime(60_000);
    expect(temporizador.segundosRestantes()).toBe(6);
    expect(agotados()).toBe(0);
    temporizador.reanudar();
    vi.advanceTimersByTime(5900);
    expect(agotados()).toBe(0);
    vi.advanceTimersByTime(200);
    expect(agotados()).toBe(1);
  });

  it('detener cancela el aviso de fin', () => {
    const { temporizador, agotados } = crear();
    temporizador.iniciar(2);
    temporizador.detener();
    vi.advanceTimersByTime(10_000);
    expect(agotados()).toBe(0);
  });

  it('iniciar de nuevo reinicia el tiempo completo', () => {
    const { temporizador, agotados } = crear();
    temporizador.iniciar(3);
    vi.advanceTimersByTime(2500);
    temporizador.iniciar(3);
    vi.advanceTimersByTime(2500);
    expect(agotados()).toBe(0);
    vi.advanceTimersByTime(600);
    expect(agotados()).toBe(1);
  });
});
