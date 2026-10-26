import { describe, expect, it } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import { aplicarCincuenta, buscarReemplazo, calcularPublico } from '@motor/juego/comodines';
import { reducir } from '@motor/juego/maquina';
import {
  aplicar,
  comenzar,
  crearContexto,
  juegoPlantilla,
  preguntaDe,
  responderYVerResultado,
} from './ayudas';

const rangos = juegoPlantilla.rangosPublico;

describe('50:50', () => {
  it('elimina dos incorrectas y nunca la correcta', () => {
    for (let semilla = 1; semilla <= 200; semilla++) {
      const pregunta = preguntaDe('X-1', 1, 'x');
      const eliminadas = aplicarCincuenta(pregunta, crearAleatorio(semilla));
      expect(eliminadas).toHaveLength(2);
      expect(new Set(eliminadas).size).toBe(2);
      expect(eliminadas).not.toContain(pregunta.correcta);
    }
  });

  it('las teclas de opciones eliminadas se ignoran', () => {
    const contexto = crearContexto(7);
    let estado = aplicar(comenzar(contexto), contexto, { tipo: 'usarCincuenta' });
    expect(estado.opcionesEliminadas).toHaveLength(2);
    for (const eliminada of estado.opcionesEliminadas) {
      expect(reducir(estado, { tipo: 'responder', opcion: eliminada }, contexto)).toBe(estado);
    }
    estado = reducir(
      estado,
      { tipo: 'responder', opcion: estado.preguntaActual!.correcta },
      contexto,
    );
    expect(estado.fase).toBe('suspenso');
  });

  it('solo se puede usar una vez', () => {
    const contexto = crearContexto(7);
    const una = aplicar(comenzar(contexto), contexto, { tipo: 'usarCincuenta' });
    expect(reducir(una, { tipo: 'usarCincuenta' }, contexto)).toBe(una);
  });
});

describe('público', () => {
  it('suma 100 con y sin 50:50 y respeta el rango de su nivel', () => {
    for (let nivel = 1; nivel <= 5; nivel++) {
      for (let semilla = 1; semilla <= 100; semilla++) {
        const pregunta = preguntaDe('X-1', nivel, 'x');
        const sin = calcularPublico(pregunta, [], rangos, crearAleatorio(semilla));
        expect(Object.values(sin).reduce((a, b) => a + b, 0)).toBe(100);
        const [minimo, maximo] = rangos[String(nivel)]!;
        expect(sin.a).toBeGreaterThanOrEqual(minimo);
        expect(sin.a).toBeLessThanOrEqual(maximo);

        const con = calcularPublico(pregunta, ['b', 'c'], rangos, crearAleatorio(semilla));
        expect(Object.values(con).reduce((a, b) => a + b, 0)).toBe(100);
        expect(con.b).toBe(0);
        expect(con.c).toBe(0);
        expect(con.a).toBeGreaterThanOrEqual(minimo);
        expect(con.a).toBeLessThanOrEqual(maximo);
      }
    }
  });

  it('todos enteros y sin negativos', () => {
    const pregunta = preguntaDe('X-1', 3, 'x');
    for (let semilla = 1; semilla <= 100; semilla++) {
      const valores = Object.values(calcularPublico(pregunta, [], rangos, crearAleatorio(semilla)));
      expect(valores.every((v) => Number.isInteger(v) && v >= 0)).toBe(true);
    }
  });

  it('si no queda ninguna incorrecta visible la correcta tiene 100', () => {
    const pregunta = preguntaDe('X-1', 3, 'x');
    const resultado = calcularPublico(pregunta, ['b', 'c', 'd'], rangos, crearAleatorio(1));
    expect(resultado).toEqual({ a: 100, b: 0, c: 0, d: 0 });
  });

  it('pausa el tiempo mientras dura y bloquea respuestas y otros comodines', () => {
    const contexto = crearContexto(3);
    const estado = aplicar(comenzar(contexto), contexto, { tipo: 'usarPublico' });
    expect(estado.publicoEnCurso).toBe(true);
    expect(estado.porcentajesPublico).not.toBeNull();
    const intento = aplicar(
      estado,
      contexto,
      { tipo: 'responder', opcion: estado.opcionesMostradas[0]! },
      { tipo: 'usarCincuenta' },
      { tipo: 'usarCambiar' },
    );
    expect(intento).toBe(estado);
    expect(aplicar(estado, contexto, { tipo: 'publicoTerminado' }).publicoEnCurso).toBe(false);
  });
});

describe('cambiar', () => {
  it('con reemplazo: otra pregunta del mismo nivel, nueva opción de turno y sin eliminadas', () => {
    const contexto = crearContexto(9);
    let estado = aplicar(comenzar(contexto), contexto, { tipo: 'usarCincuenta' });
    const antes = estado;
    estado = aplicar(estado, contexto, { tipo: 'usarCambiar' });
    expect(estado.preguntaActual!.id).not.toBe(antes.preguntaActual!.id);
    expect(estado.preguntaActual!.nivel).toBe(antes.preguntaActual!.nivel);
    expect(estado.turno).toBe(antes.turno + 1);
    expect(estado.opcionesEliminadas).toEqual([]);
    expect(estado.comodinesUsados).toContain('cambiar');
    expect(estado.preguntasUsadas).toContain(antes.preguntaActual!.id);
  });

  it('prefiere otro tema cuando lo hay', () => {
    for (let semilla = 1; semilla <= 30; semilla++) {
      const contexto = crearContexto(semilla);
      const inicial = comenzar(contexto);
      const cambiada = aplicar(inicial, contexto, { tipo: 'usarCambiar' });
      expect(cambiada.preguntaActual!.tema).not.toBe(inicial.preguntaActual!.tema);
    }
  });

  it('no sale de los temas elegidos', () => {
    for (let semilla = 1; semilla <= 30; semilla++) {
      const contexto = crearContexto(semilla);
      const cambiada = aplicar(comenzar(contexto, ['ciencia']), contexto, { tipo: 'usarCambiar' });
      expect(cambiada.preguntaActual!.tema).toBe('ciencia');
    }
  });

  it('sin reemplazo no gasta el comodín', () => {
    const pregunta = preguntaDe('X-1', 1, 'x');
    const contexto = crearContexto(1, { banco: [pregunta] });
    const estado = comenzar(contexto, ['x']);
    const intento = reducir(estado, { tipo: 'usarCambiar' }, contexto);
    expect(intento).toBe(estado);
    expect(intento.comodinesUsados).not.toContain('cambiar');
    expect(
      buscarReemplazo(
        [pregunta],
        pregunta,
        { preguntasUsadas: ['X-1'], temasUsados: {}, temaAnterior: null },
        crearAleatorio(1),
      ),
    ).toBeNull();
  });

  it('no se puede usar fuera de la pregunta', () => {
    const contexto = crearContexto(2);
    const inicial = comenzar(contexto);
    const estado = responderYVerResultado(inicial, contexto, inicial.preguntaActual!.correcta);
    expect(reducir(estado, { tipo: 'usarCambiar' }, contexto)).toBe(estado);
  });
});
