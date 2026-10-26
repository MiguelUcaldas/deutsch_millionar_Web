import { describe, expect, it } from 'vitest';
import { reducir, estadoInicial, premioObtenido, type Contexto } from '@motor/juego/maquina';
import { formatearDinero } from '@motor/juego/premios';
import { banco, cantidadDisponible, configuracion, crearContexto } from './ayudas';

const { juego } = configuracion;
const TODOS = banco.temas.map((t) => t.id);

function responder(contexto: Contexto, estado = estadoInicial(), correcta = true) {
  const pregunta = estado.preguntaActual!;
  const opcion = correcta
    ? pregunta.correcta
    : estado.opcionesMostradas.find((o) => o !== pregunta.correcta)!;
  let actual = reducir(estado, { tipo: 'responder', opcion }, contexto);
  actual = reducir(actual, { tipo: 'finSuspenso' }, contexto);
  actual = reducir(actual, { tipo: 'verResultado' }, contexto);
  return reducir(actual, { tipo: 'siguiente' }, contexto);
}

function comenzar(contexto: Contexto, temas: string[]) {
  return reducir(estadoInicial(), { tipo: 'comenzar', temasElegidos: temas }, contexto);
}

function perderEn(numero: number, semilla = 3) {
  const contexto = crearContexto(semilla);
  let estado = comenzar(contexto, TODOS);
  while (estado.numeroPregunta < numero) estado = responder(contexto, estado);
  return premioObtenido(responder(contexto, estado, false), juego);
}

describe('premio asegurado (euros)', () => {
  it('perder en la pregunta 3 no deja nada', () => {
    expect(perderEn(3)).toBe(0);
  });
  it('perder en la 7 deja 1.000', () => {
    expect(perderEn(7)).toBe(1000);
  });
  it('perder en la 12 deja 32.000', () => {
    expect(perderEn(12)).toBe(32000);
  });
  it('perder en la 5 o en la 10 no asegura esa pregunta', () => {
    expect(perderEn(5)).toBe(0);
    expect(perderEn(10)).toBe(1000);
  });
  it('se muestra con el formato «€ 1.000.000»', () => {
    expect(formatearDinero(configuracion.moneda, 1000000)).toBe('€ 1.000.000');
    expect(formatearDinero(configuracion.moneda, 100)).toBe('€ 100');
  });
});

describe('selección con el banco alemán', () => {
  it('no repite preguntas en una partida de 15, con muchas semillas', () => {
    for (let semilla = 1; semilla <= 30; semilla++) {
      const contexto = crearContexto(semilla);
      let estado = comenzar(contexto, TODOS);
      const ids: string[] = [];
      while (estado.fase === 'pregunta') {
        ids.push(estado.preguntaActual!.id);
        estado = responder(contexto, estado);
      }
      expect(estado.fase).toBe('victoria');
      expect(ids).toHaveLength(15);
      expect(new Set(ids).size).toBe(15);
    }
  });

  it('un tema pequeño no alcanza el mínimo de 16 y dos temas sí', () => {
    const minimo = juego.minimoPreguntasPartida;
    expect(minimo).toBe(16);
    expect(cantidadDisponible(['acusativo'])).toBeLessThan(minimo);
    expect(cantidadDisponible(['acusativo', 'nominativo'])).toBeGreaterThanOrEqual(minimo);
    expect(cantidadDisponible(['der_die_das'])).toBeGreaterThanOrEqual(minimo);
  });

  it('la partida no sale de los temas elegidos', () => {
    const elegidos = ['acusativo', 'nominativo', 'articulos'];
    for (let semilla = 1; semilla <= 10; semilla++) {
      const contexto = crearContexto(semilla);
      let estado = comenzar(contexto, elegidos);
      while (estado.fase === 'pregunta') {
        expect(elegidos).toContain(estado.preguntaActual!.tema);
        estado = responder(contexto, estado);
      }
    }
  });

  it('con un solo tema grande (der/die/das) se puede jugar completo', () => {
    const contexto = crearContexto(4);
    let estado = comenzar(contexto, ['der_die_das']);
    while (estado.fase === 'pregunta') estado = responder(contexto, estado);
    expect(estado.fase).toBe('victoria');
  });

  it('Cambiar respeta los temas elegidos', () => {
    const elegidos = ['acusativo', 'nominativo', 'articulos'];
    for (let semilla = 1; semilla <= 20; semilla++) {
      const contexto = crearContexto(semilla);
      const inicial = comenzar(contexto, elegidos);
      const nueva = reducir(inicial, { tipo: 'usarCambiar' }, contexto);
      expect(nueva.comodinesUsados).toContain('cambiar');
      expect(elegidos).toContain(nueva.preguntaActual!.tema);
    }
  });

  it('las preguntas der/die/das conservan el orden de opciones', () => {
    const contexto = crearContexto(2);
    const estado = comenzar(contexto, ['der_die_das']);
    expect(estado.opcionesMostradas).toEqual(['der', 'die', 'das', 'den']);
  });

  it('el tiempo por pregunta sale del número de pregunta', () => {
    expect(juego.segundosPorNivel['1']).toBe(30);
    expect(juego.segundosPorNivel['5']).toBe(45);
  });
});
