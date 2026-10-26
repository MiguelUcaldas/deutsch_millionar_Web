import { describe, expect, it } from 'vitest';
import { reducir, estadoInicial, bancoDeTemas, premioObtenido } from '@motor/juego/maquina';
import { esPreguntaSegura, totalPreguntas } from '@motor/juego/premios';
import {
  aplicar,
  banco,
  comenzar,
  crearContexto,
  juegoCon,
  opcionIncorrecta,
  responderYVerResultado,
  todosLosTemas,
  juegoPlantilla,
} from './ayudas';

function jugarCorrectas(contexto = crearContexto(), temas = todosLosTemas()) {
  let estado = comenzar(contexto, temas);
  const vistas: string[] = [];
  const niveles: number[] = [];
  while (estado.fase === 'pregunta') {
    vistas.push(estado.preguntaActual!.id);
    niveles.push(estado.preguntaActual!.nivel);
    estado = responderYVerResultado(estado, contexto, estado.preguntaActual!.correcta);
    estado = reducir(estado, { tipo: 'siguiente' }, contexto);
  }
  return { estado, vistas, niveles };
}

describe('partida completa', () => {
  it('juega tantas preguntas como premios, sin repetir, y termina en victoria', () => {
    for (let semilla = 1; semilla <= 20; semilla++) {
      const { estado, vistas } = jugarCorrectas(crearContexto(semilla));
      expect(estado.fase).toBe('victoria');
      expect(vistas).toHaveLength(totalPreguntas(juegoPlantilla));
      expect(new Set(vistas).size).toBe(vistas.length);
    }
  });

  it('usa el nivel que pide cada número de pregunta cuando hay preguntas suficientes', () => {
    const { niveles } = jugarCorrectas(crearContexto(3));
    expect(niveles).toEqual(juegoPlantilla.nivelPorPregunta);
  });

  it('con 15 preguntas también funciona (nada está fijo)', () => {
    const juego = juegoCon({
      premios: Array.from({ length: 15 }, (_, i) => (i + 1) * 100),
      nivelPorPregunta: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5],
      preguntasSeguras: [5, 10],
    });
    const { estado, vistas } = jugarCorrectas(crearContexto(5, { juego }));
    expect(estado.fase).toBe('victoria');
    expect(vistas).toHaveLength(15);
    expect(new Set(vistas).size).toBe(15);
  });

  it('con 10 preguntas y 3 niveles también funciona', () => {
    const juego = juegoCon({
      premios: Array.from({ length: 10 }, (_, i) => (i + 1) * 10),
      nivelPorPregunta: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
      preguntasSeguras: [3, 7],
      segundosPorNivel: { 1: 20, 2: 25, 3: 30 },
      rangosPublico: { 1: [70, 85], 2: [55, 70], 3: [40, 55] },
    });
    const { estado, niveles } = jugarCorrectas(crearContexto(8, { juego }));
    expect(estado.fase).toBe('victoria');
    expect(niveles).toEqual(juego.nivelPorPregunta);
  });

  it('nunca sale de los temas elegidos', () => {
    for (const tema of todosLosTemas()) {
      const { vistas } = jugarCorrectas(crearContexto(2), [tema]);
      const idsDelTema = new Set(banco.preguntas.filter((p) => p.tema === tema).map((p) => p.id));
      expect(vistas.every((id) => idsDelTema.has(id))).toBe(true);
    }
  });

  it('no repite tema dos veces seguidas con varios temas mientras haya alternativa', () => {
    const contexto = crearContexto(4);
    let actual = comenzar(contexto);
    let anterior = actual.preguntaActual!.tema;
    for (let i = 1; i < 6; i++) {
      actual = reducir(
        responderYVerResultado(actual, contexto, actual.preguntaActual!.correcta),
        { tipo: 'siguiente' },
        contexto,
      );
      expect(actual.preguntaActual!.tema).not.toBe(anterior);
      anterior = actual.preguntaActual!.tema;
    }
  });

  it('si no hay preguntas suficientes pasa a la fase de error', () => {
    const contexto = crearContexto(1, { banco: banco.preguntas.slice(0, 3) });
    let estado = comenzar(contexto);
    for (let i = 0; i < 6 && estado.fase === 'pregunta'; i++) {
      estado = reducir(
        responderYVerResultado(estado, contexto, estado.preguntaActual!.correcta),
        { tipo: 'siguiente' },
        contexto,
      );
    }
    expect(estado.fase).toBe('error');
    expect(estado.mensajeError).toBeTruthy();
  });

  it('comenzar sin temas es un error y comenzar fuera del inicio se ignora', () => {
    const contexto = crearContexto();
    expect(reducir(estadoInicial(), { tipo: 'comenzar', temasElegidos: [] }, contexto).fase).toBe(
      'error',
    );
    const enCurso = comenzar(contexto);
    expect(reducir(enCurso, { tipo: 'comenzar', temasElegidos: todosLosTemas() }, contexto)).toBe(
      enCurso,
    );
  });

  it('el banco de la partida solo incluye los temas elegidos', () => {
    expect(bancoDeTemas(banco.preguntas, ['ciencia']).every((p) => p.tema === 'ciencia')).toBe(
      true,
    );
  });
});

describe('premio asegurado', () => {
  const [primera, segunda] = juegoPlantilla.preguntasSeguras as [number, number];

  function perderEn(numero: number) {
    const contexto = crearContexto(11);
    let estado = comenzar(contexto);
    while (estado.numeroPregunta < numero) {
      estado = reducir(
        responderYVerResultado(estado, contexto, estado.preguntaActual!.correcta),
        { tipo: 'siguiente' },
        contexto,
      );
    }
    estado = responderYVerResultado(estado, contexto, opcionIncorrecta(estado));
    return reducir(estado, { tipo: 'siguiente' }, contexto);
  }

  it('antes del primer seguro se pierde todo', () => {
    const estado = perderEn(primera - 1);
    expect(estado.fase).toBe('derrota');
    expect(premioObtenido(estado, juegoPlantilla)).toBe(0);
  });

  it('entre los dos seguros se conserva el primero', () => {
    const estado = perderEn(primera + 1);
    expect(premioObtenido(estado, juegoPlantilla)).toBe(juegoPlantilla.premios[primera - 1]);
  });

  it('después del segundo seguro se conserva el segundo', () => {
    const estado = perderEn(segunda + 1);
    expect(premioObtenido(estado, juegoPlantilla)).toBe(juegoPlantilla.premios[segunda - 1]);
  });

  it('fallar justo en la pregunta segura no la asegura', () => {
    expect(premioObtenido(perderEn(primera), juegoPlantilla)).toBe(0);
  });

  it('acertar la pregunta segura la asegura al terminar el suspenso', () => {
    const contexto = crearContexto(11);
    let estado = comenzar(contexto);
    while (!esPreguntaSegura(juegoPlantilla, estado.numeroPregunta)) {
      estado = reducir(
        responderYVerResultado(estado, contexto, estado.preguntaActual!.correcta),
        { tipo: 'siguiente' },
        contexto,
      );
    }
    estado = aplicar(estado, contexto, {
      tipo: 'responder',
      opcion: estado.preguntaActual!.correcta,
    });
    expect(estado.premioAsegurado).toBe(0);
    estado = aplicar(estado, contexto, { tipo: 'finSuspenso' });
    expect(estado.premioAsegurado).toBe(juegoPlantilla.premios[primera - 1]);
  });

  it('la victoria entrega el premio máximo', () => {
    const { estado } = jugarCorrectas();
    expect(premioObtenido(estado, juegoPlantilla)).toBe(juegoPlantilla.premios.at(-1));
  });
});
