import { describe, expect, it } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import {
  calcularMaximoPorTema,
  elegirPregunta,
  type HistorialSeleccion,
  type ReglasSeleccion,
} from '@motor/juego/seleccion';
import { preguntaDe } from './ayudas';

const reglas: ReglasSeleccion = {
  maximoPorTema: 2,
  unSoloTema: false,
  nivelMinimo: 1,
  nivelMaximo: 5,
};
const vacio: HistorialSeleccion = { preguntasUsadas: [], temasUsados: {}, temaAnterior: null };

describe('seleccion de preguntas', () => {
  it('el máximo por tema es el mayor entre la base y la parte proporcional', () => {
    expect(calcularMaximoPorTema(2, 15, 11)).toBe(2);
    expect(calcularMaximoPorTema(2, 15, 2)).toBe(8);
    expect(calcularMaximoPorTema(2, 15, 1)).toBe(15);
    expect(calcularMaximoPorTema(2, 10, 3)).toBe(4);
  });

  it('a) respeta nivel, tema anterior y tope por tema', () => {
    const banco = [preguntaDe('A-1', 2, 'a'), preguntaDe('B-1', 2, 'b')];
    const historial = { ...vacio, temaAnterior: 'a' };
    const elegida = elegirPregunta(banco, historial, reglas, 2, crearAleatorio(1));
    expect(elegida?.id).toBe('B-1');
  });

  it('b) sin tope por tema cuando el tope deja sin candidatas', () => {
    const banco = [preguntaDe('A-1', 2, 'a'), preguntaDe('A-2', 2, 'a')];
    const historial: HistorialSeleccion = {
      preguntasUsadas: [],
      temasUsados: { a: 2 },
      temaAnterior: 'b',
    };
    expect(elegirPregunta(banco, historial, reglas, 2, crearAleatorio(1))).not.toBeNull();
  });

  it('c) sin evitar el tema anterior cuando solo queda ese tema', () => {
    const banco = [preguntaDe('A-1', 2, 'a')];
    const historial: HistorialSeleccion = {
      preguntasUsadas: [],
      temasUsados: { a: 5 },
      temaAnterior: 'a',
    };
    expect(elegirPregunta(banco, historial, reglas, 2, crearAleatorio(1))?.id).toBe('A-1');
  });

  it('d) baja un nivel si el objetivo se agotó', () => {
    const banco = [preguntaDe('A-1', 1, 'a'), preguntaDe('A-2', 4, 'a')];
    expect(elegirPregunta(banco, vacio, reglas, 2, crearAleatorio(1))?.id).toBe('A-1');
  });

  it('e) sube un nivel si bajar tampoco sirve', () => {
    const banco = [preguntaDe('A-1', 3, 'a')];
    expect(elegirPregunta(banco, vacio, reglas, 2, crearAleatorio(1))?.id).toBe('A-1');
  });

  it('no baja de nivel mínimo ni sube del máximo', () => {
    const banco = [preguntaDe('A-0', 0, 'a'), preguntaDe('A-6', 6, 'a')];
    expect(elegirPregunta(banco, vacio, reglas, 1, crearAleatorio(1))).toBeNull();
    expect(elegirPregunta(banco, vacio, reglas, 5, crearAleatorio(1))).toBeNull();
  });

  it('con un solo tema no aplica «no repetir tema»', () => {
    const banco = [preguntaDe('A-1', 1, 'a'), preguntaDe('A-2', 1, 'a')];
    const historial = {
      ...vacio,
      preguntasUsadas: ['A-1'],
      temaAnterior: 'a',
      temasUsados: { a: 1 },
    };
    const elegida = elegirPregunta(
      banco,
      historial,
      { ...reglas, unSoloTema: true, maximoPorTema: 15 },
      1,
      crearAleatorio(1),
    );
    expect(elegida?.id).toBe('A-2');
  });

  it('no repite preguntas usadas y devuelve null si no queda ninguna', () => {
    const banco = [preguntaDe('A-1', 1, 'a')];
    const historial = { ...vacio, preguntasUsadas: ['A-1'] };
    expect(elegirPregunta(banco, historial, reglas, 1, crearAleatorio(1))).toBeNull();
  });

  it('es determinista con la misma semilla', () => {
    const banco = Array.from({ length: 8 }, (_, i) => preguntaDe(`T${i}-1`, 1, `t${i}`));
    const primera = elegirPregunta(banco, vacio, reglas, 1, crearAleatorio(42));
    const segunda = elegirPregunta(banco, vacio, reglas, 1, crearAleatorio(42));
    expect(primera?.id).toBe(segunda?.id);
  });
});
