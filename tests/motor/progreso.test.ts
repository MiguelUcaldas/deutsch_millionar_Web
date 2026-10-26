import { describe, expect, it } from 'vitest';
import {
  INTERVALOS_EN_DIAS,
  leerProgreso,
  preguntasMasFalladas,
  preguntasPendientes,
  progresoVacio,
  registrarPartida,
  registrarRespuesta,
  temasMasFallados,
} from '@motor/estado/progreso';

const DIA = 24 * 60 * 60 * 1000;
const P = { id: 'GEO-001', tema: 'geografia' };

describe('progreso: respuestas y repaso espaciado', () => {
  it('acertar algo que nunca se falló solo cuenta en el tema', () => {
    const p = registrarRespuesta(progresoVacio(), P, true, 0);
    expect(p.temas['geografia']).toEqual({ aciertos: 1, fallos: 0 });
    expect(p.preguntas).toEqual({});
  });

  it('fallar una pregunta la deja pendiente de inmediato', () => {
    const p = registrarRespuesta(progresoVacio(), P, false, 1000);
    expect(p.preguntas['GEO-001']).toEqual({ fallos: 1, aciertos: 0, caja: 0, proxima: 1000 });
    expect(preguntasPendientes(p, 1000)).toEqual(['GEO-001']);
  });

  it('cada acierto posterior la espacia más, hasta la última caja', () => {
    let p = registrarRespuesta(progresoVacio(), P, false, 0);
    let ahora = 0;
    const esperadas = INTERVALOS_EN_DIAS.slice(1);
    for (const dias of esperadas) {
      p = registrarRespuesta(p, P, true, ahora);
      expect(p.preguntas['GEO-001']!.proxima).toBe(ahora + dias * DIA);
      expect(preguntasPendientes(p, ahora)).toEqual([]);
      ahora += dias * DIA;
      expect(preguntasPendientes(p, ahora)).toEqual(['GEO-001']);
    }
    // Un acierto más no pasa de la última caja.
    p = registrarRespuesta(p, P, true, ahora);
    expect(p.preguntas['GEO-001']!.caja).toBe(INTERVALOS_EN_DIAS.length - 1);
  });

  it('fallar de nuevo la devuelve a la primera caja y suma el fallo', () => {
    let p = registrarRespuesta(progresoVacio(), P, false, 0);
    p = registrarRespuesta(p, P, true, 0);
    p = registrarRespuesta(p, P, false, 5000);
    expect(p.preguntas['GEO-001']).toEqual({ fallos: 2, aciertos: 1, caja: 0, proxima: 5000 });
  });

  it('las pendientes salen de la más atrasada a la más reciente', () => {
    let p = registrarRespuesta(progresoVacio(), { id: 'B', tema: 't' }, false, 300);
    p = registrarRespuesta(p, { id: 'A', tema: 't' }, false, 100);
    p = registrarRespuesta(p, { id: 'C', tema: 't' }, false, 900);
    expect(preguntasPendientes(p, 500)).toEqual(['A', 'B']);
  });

  it('no muta el progreso original', () => {
    const original = progresoVacio();
    registrarRespuesta(original, P, false, 0);
    expect(original).toEqual(progresoVacio());
  });
});

describe('progreso: partidas, temas y lecturas', () => {
  it('guarda el récord y cuenta partidas y victorias', () => {
    let p = registrarPartida(progresoVacio(), { superadas: 7, premio: 8000, victoria: false });
    p = registrarPartida(p, { superadas: 4, premio: 500, victoria: false });
    p = registrarPartida(p, { superadas: 15, premio: 1000000, victoria: true });
    expect(p).toMatchObject({ partidas: 3, victorias: 1, mejorPregunta: 15, mejorPremio: 1000000 });
  });

  it('los temas más fallados piden un mínimo de respuestas y ordenan por tasa de fallo', () => {
    let p = progresoVacio();
    for (const [tema, aciertos, fallos] of [
      ['a', 1, 3],
      ['b', 8, 2],
      ['c', 0, 1],
      ['d', 5, 0],
    ] as const) {
      for (let i = 0; i < aciertos; i++)
        p = registrarRespuesta(p, { id: `${tema}${i}`, tema }, true, 0);
      for (let i = 0; i < fallos; i++)
        p = registrarRespuesta(p, { id: `${tema}f${i}`, tema }, false, 0);
    }
    const resultado = temasMasFallados(p);
    expect(resultado.map((t) => t.tema)).toEqual(['a', 'b']);
    expect(resultado[0]!.tasaDeFallo).toBe(0.75);
  });

  it('las preguntas más falladas salen por cantidad de fallos', () => {
    let p = progresoVacio();
    for (const [id, veces] of [
      ['x', 1],
      ['y', 3],
      ['z', 2],
    ] as const) {
      for (let i = 0; i < veces; i++) p = registrarRespuesta(p, { id, tema: 't' }, false, 0);
    }
    expect(preguntasMasFalladas(p, 2)).toEqual(['y', 'z']);
  });

  it('un progreso dañado o de otra versión vuelve a empezar en vez de romper', () => {
    expect(leerProgreso(null)).toEqual(progresoVacio());
    expect(leerProgreso({ version: 2 })).toEqual(progresoVacio());
    expect(leerProgreso('basura')).toEqual(progresoVacio());
    const valido = registrarPartida(progresoVacio(), {
      superadas: 3,
      premio: 100,
      victoria: false,
    });
    expect(leerProgreso(JSON.parse(JSON.stringify(valido)))).toEqual(valido);
  });
});
