import { describe, expect, it } from 'vitest';
import { reducir, estadoInicial } from '@motor/juego/maquina';
import {
  aplicar,
  comenzar,
  crearContexto,
  opcionIncorrecta,
  responderYVerResultado,
} from './ayudas';

describe('máquina de estados', () => {
  it('tiempoAgotado con un turno viejo se ignora', () => {
    const contexto = crearContexto(1);
    const primera = comenzar(contexto);
    const segunda = reducir(
      responderYVerResultado(primera, contexto, primera.preguntaActual!.correcta),
      { tipo: 'siguiente' },
      contexto,
    );
    expect(segunda.turno).toBeGreaterThan(primera.turno);
    expect(reducir(segunda, { tipo: 'tiempoAgotado', turno: primera.turno }, contexto)).toBe(
      segunda,
    );
  });

  it('tiempoAgotado del turno actual lleva al resultado con motivo «tiempo»', () => {
    const contexto = crearContexto(1);
    const estado = comenzar(contexto);
    const agotado = reducir(estado, { tipo: 'tiempoAgotado', turno: estado.turno }, contexto);
    expect(agotado.fase).toBe('resultado');
    expect(agotado.motivoFin).toBe('tiempo');
    expect(agotado.acerto).toBe(false);
    expect(reducir(agotado, { tipo: 'siguiente' }, contexto).fase).toBe('derrota');
  });

  it('si se responde y se agota a la vez gana la primera acción', () => {
    const contexto = crearContexto(1);
    const estado = comenzar(contexto);
    const respondida = reducir(
      estado,
      { tipo: 'responder', opcion: estado.opcionesMostradas[0]! },
      contexto,
    );
    expect(reducir(respondida, { tipo: 'tiempoAgotado', turno: estado.turno }, contexto)).toBe(
      respondida,
    );

    const agotada = reducir(estado, { tipo: 'tiempoAgotado', turno: estado.turno }, contexto);
    expect(
      reducir(agotada, { tipo: 'responder', opcion: estado.opcionesMostradas[0]! }, contexto),
    ).toBe(agotada);
  });

  it('ignora acciones fuera de lugar sin lanzar errores', () => {
    const contexto = crearContexto(1);
    const inicio = estadoInicial();
    for (const accion of [
      { tipo: 'responder', opcion: 'a' },
      { tipo: 'usarCincuenta' },
      { tipo: 'usarPublico' },
      { tipo: 'usarCambiar' },
      { tipo: 'finSuspenso' },
      { tipo: 'verResultado' },
      { tipo: 'siguiente' },
      { tipo: 'publicoTerminado' },
      { tipo: 'tiempoAgotado', turno: 0 },
    ] as const) {
      expect(reducir(inicio, accion, contexto)).toBe(inicio);
    }
  });

  it('durante el suspenso no se acepta otra respuesta ni comodines', () => {
    const contexto = crearContexto(2);
    const estado = reducir(
      comenzar(contexto),
      { tipo: 'responder', opcion: comenzar(contexto).opcionesMostradas[0]! },
      contexto,
    );
    expect(estado.fase).toBe('suspenso');
    expect(
      aplicar(estado, contexto, { tipo: 'responder', opcion: estado.opcionesMostradas[1]! }),
    ).toBe(estado);
    expect(aplicar(estado, contexto, { tipo: 'usarCincuenta' })).toBe(estado);
  });

  it('responder una opción que no existe se ignora', () => {
    const contexto = crearContexto(2);
    const estado = comenzar(contexto);
    expect(reducir(estado, { tipo: 'responder', opcion: 'no existe' }, contexto)).toBe(estado);
  });

  it('una respuesta incorrecta marca el motivo y termina en derrota', () => {
    const contexto = crearContexto(2);
    let estado = comenzar(contexto);
    estado = aplicar(
      estado,
      contexto,
      { tipo: 'responder', opcion: opcionIncorrecta(estado) },
      { tipo: 'finSuspenso' },
    );
    expect(estado.fase).toBe('revelacion');
    expect(estado.motivoFin).toBe('incorrecta');
    estado = aplicar(estado, contexto, { tipo: 'verResultado' }, { tipo: 'siguiente' });
    expect(estado.fase).toBe('derrota');
  });

  it('nuevaPartida vuelve al inicio con todo limpio', () => {
    const contexto = crearContexto(2);
    const estado = reducir(comenzar(contexto), { tipo: 'nuevaPartida' }, contexto);
    expect(estado).toEqual(estadoInicial());
  });

  it('el orden de las opciones se baraja salvo mantener_orden', () => {
    const contexto = crearContexto(1);
    const barajadas = new Set<string>();
    for (let semilla = 1; semilla <= 20; semilla++) {
      const c = crearContexto(semilla);
      barajadas.add(comenzar(c).opcionesMostradas.join('|'));
    }
    expect(barajadas.size).toBeGreaterThan(1);
    const fija = { ...contexto.banco[0]!, mantener_orden: true };
    const estado = comenzar({ ...contexto, banco: [fija] }, [fija.tema]);
    expect(estado.opcionesMostradas).toEqual(fija.opciones);
  });
});
