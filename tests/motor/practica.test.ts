import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import { crearControlador } from '@motor/juego/controlador';
import { estadoInicial, reducir } from '@motor/juego/maquina';
import { aplicar, banco, crearContexto, juegoPlantilla } from './ayudas';

const geografia = banco.preguntas.filter((p) => p.tema === 'geografia').map((p) => p.id);

function comenzarPractica(ids = geografia) {
  const contexto = crearContexto(3);
  const estado = reducir(
    estadoInicial(),
    { tipo: 'comenzarPractica', titulo: 'Geografía', preguntas: ids },
    contexto,
  );
  return { contexto, estado };
}

function responderYContinuar(
  contexto: ReturnType<typeof crearContexto>,
  estado: ReturnType<typeof comenzarPractica>['estado'],
  correcta: boolean,
) {
  const pregunta = estado.preguntaActual!;
  const opcion = correcta
    ? pregunta.correcta
    : estado.opcionesMostradas.find((o) => o !== pregunta.correcta)!;
  return aplicar(
    estado,
    contexto,
    { tipo: 'responder', opcion },
    { tipo: 'finSuspenso' },
    { tipo: 'verResultado' },
  );
}

describe('modo práctica (máquina)', () => {
  it('empieza con la primera pregunta de la cola, sin comodines ni dinero', () => {
    const { estado } = comenzarPractica();
    expect(estado.fase).toBe('pregunta');
    expect(estado.practica).toEqual({
      titulo: 'Geografía',
      cola: geografia,
      aciertos: 0,
      respondidas: 0,
    });
    expect(estado.preguntaActual!.id).toBe(geografia[0]);
    expect(estado.numeroPregunta).toBe(1);
  });

  it('no se puede usar ningún comodín', () => {
    const { contexto, estado } = comenzarPractica();
    for (const tipo of ['usarCincuenta', 'usarPublico', 'usarCambiar'] as const) {
      expect(reducir(estado, { tipo }, contexto)).toBe(estado);
    }
  });

  it('el tiempo agotado se ignora', () => {
    const { contexto, estado } = comenzarPractica();
    expect(reducir(estado, { tipo: 'tiempoAgotado', turno: estado.turno }, contexto)).toBe(estado);
  });

  it('fallar no termina la práctica: sigue con la próxima pregunta de la cola', () => {
    const { contexto, estado } = comenzarPractica();
    const fallada = reducir(
      responderYContinuar(contexto, estado, false),
      { tipo: 'siguiente' },
      contexto,
    );
    expect(fallada.fase).toBe('pregunta');
    expect(fallada.preguntaActual!.id).toBe(geografia[1]);
    expect(fallada.numeroPregunta).toBe(2);
    expect(fallada.practica).toMatchObject({ aciertos: 0, respondidas: 1 });
  });

  it('al terminar la cola pasa a finPractica con el resumen', () => {
    const { contexto, estado: inicial } = comenzarPractica();
    let estado = inicial;
    for (let i = 0; i < geografia.length; i++) {
      estado = reducir(
        responderYContinuar(contexto, estado, i % 2 === 0),
        { tipo: 'siguiente' },
        contexto,
      );
    }
    expect(estado.fase).toBe('finPractica');
    expect(estado.practica).toMatchObject({ respondidas: 10, aciertos: 5 });
    expect(estado.premioAsegurado).toBe(0);
  });

  it('«terminar» corta la práctica en cualquier momento', () => {
    const { contexto, estado } = comenzarPractica();
    const fin = reducir(estado, { tipo: 'terminarPractica' }, contexto);
    expect(fin.fase).toBe('finPractica');
    expect(reducir(estadoInicial(), { tipo: 'terminarPractica' }, contexto).fase).toBe('inicio');
  });

  it('una cola vacía es un error y solo se puede empezar desde el inicio', () => {
    const contexto = crearContexto();
    expect(
      reducir(estadoInicial(), { tipo: 'comenzarPractica', titulo: 'x', preguntas: [] }, contexto)
        .fase,
    ).toBe('error');
    const { estado } = comenzarPractica();
    expect(
      reducir(estado, { tipo: 'comenzarPractica', titulo: 'x', preguntas: geografia }, contexto),
    ).toBe(estado);
  });

  it('nuevaPartida sale de la práctica', () => {
    const { contexto, estado } = comenzarPractica();
    expect(reducir(estado, { tipo: 'nuevaPartida' }, contexto)).toEqual(estadoInicial());
  });
});

describe('modo práctica (controlador)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('no hay temporizador y se pasa al resultado casi enseguida', () => {
    const controlador = crearControlador({
      juego: juegoPlantilla,
      banco: banco.preguntas,
      aleatorio: crearAleatorio(2),
    });
    controlador.despachar({ tipo: 'comenzarPractica', titulo: 'G', preguntas: geografia });
    // Con el tiempo normal habría perdido por tiempo.
    vi.advanceTimersByTime(120_000);
    expect(controlador.estado().fase).toBe('pregunta');
    expect(controlador.segundosRestantes()).toBe(0);

    controlador.despachar({
      tipo: 'responder',
      opcion: controlador.estado().preguntaActual!.correcta,
    });
    vi.advanceTimersByTime(1);
    expect(controlador.estado().fase).toBe('revelacion'); // sin suspenso
    vi.advanceTimersByTime(juegoPlantilla.duracionesMs.antesDeResultado + 1);
    expect(controlador.estado().fase).toBe('resultado');
    controlador.destruir();
  });
});
