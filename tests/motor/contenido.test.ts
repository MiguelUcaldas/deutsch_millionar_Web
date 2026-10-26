import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { armarBanco, fuentesDesdeModulos, type FuentesContenido } from '@motor/contenido/cargar';
import {
  esquemaConfiguracion,
  esquemaJuego,
  type GeneradorPreguntas,
} from '@motor/contenido/esquemas';
import { crearRegistro } from '@motor/contenido/registro';
import { crearAleatorio } from '@motor/juego/aleatorio';
import { formatearDinero, proximaSegura } from '@motor/juego/premios';
import { mezclarTextos, textosPorDefecto } from '@motor/textos';
import { banco, configuracion, fuentesDelTest, juegoPlantilla, registro } from './ayudas';

describe('temario plantilla', () => {
  it('carga sin avisos: 2 temas, 20 preguntas, 3 fichas', () => {
    expect(banco.avisos).toEqual([]);
    expect(banco.temas.map((t) => t.id)).toEqual(['geografia', 'ciencia']);
    expect(banco.preguntas).toHaveLength(20);
    expect(Object.keys(banco.fichas).sort()).toEqual([
      'escala_planetas',
      'regla_capitales',
      'tabla_estados_agua',
    ]);
  });

  it('tiene 2 preguntas por nivel en cada tema', () => {
    for (const tema of banco.temas) {
      for (let nivel = 1; nivel <= 5; nivel++) {
        const cantidad = banco.preguntas.filter(
          (p) => p.tema === tema.id && p.nivel === nivel,
        ).length;
        expect(cantidad, `${tema.id} nivel ${nivel}`).toBe(2);
      }
    }
  });

  it('su configuración cumple el esquema', () => {
    expect(esquemaConfiguracion.safeParse(configuracion).success).toBe(true);
  });

  it('las fichas de tipo distinto existen una por cada tipo genérico', () => {
    expect(new Set(Object.values(banco.fichas).map((f) => f.tipo))).toEqual(
      new Set(['tabla', 'escala', 'regla']),
    );
  });
});

describe('carga tolerante', () => {
  const temaBase = {
    id: 'uno',
    prefijo: 'UNO',
    orden: 1,
    nombre_corto: 'Uno',
    titulo: 'Uno',
    resumen: 'r',
    que_es: 'q',
    como_reconocerlo: [],
    ejemplos: [],
    errores_comunes: [],
  };
  const preguntaBase = {
    id: 'UNO-001',
    nivel: 1,
    enunciado: 'E',
    opciones: ['a', 'b', 'c', 'd'],
    correcta: 'a',
    explicacion: 'x',
  };
  const armar = (fuentes: FuentesContenido, reg = registro) =>
    armarBanco(fuentes, juegoPlantilla, reg, crearAleatorio(1));
  const conPreguntas = (preguntas: unknown[]): FuentesContenido => ({
    temas: { uno: { tema: temaBase, preguntas, datos: {} } },
    fichas: {},
  });

  it('acepta una pregunta válida', () => {
    const resultado = armar(conPreguntas([preguntaBase]));
    expect(resultado.avisos).toEqual([]);
    expect(resultado.preguntas[0]?.tema).toBe('uno');
  });

  it.each([
    ['id repetido', [preguntaBase, preguntaBase]],
    ['prefijo equivocado', [{ ...preguntaBase, id: 'XXX-001' }]],
    ['nivel inexistente', [{ ...preguntaBase, nivel: 9 }]],
    ['opciones repetidas', [{ ...preguntaBase, opciones: ['a', 'a', 'c', 'd'] }]],
    ['correcta fuera de opciones', [{ ...preguntaBase, correcta: 'z' }]],
    ['solo tres opciones', [{ ...preguntaBase, opciones: ['a', 'b', 'c'] }]],
    ['campo desconocido', [{ ...preguntaBase, tipografia: 'x' }]],
    ['ficha inexistente', [{ ...preguntaBase, ficha: 'no_existe' }]],
    ['tipo de ficha sin registrar', [{ ...preguntaBase, ficha: { tipo: 'rara' } }]],
    ['tipo de apoyo sin registrar', [{ ...preguntaBase, apoyo: { tipo: 'reloj' } }]],
  ])('omite con aviso: %s', (_nombre, preguntas) => {
    const resultado = armar(conPreguntas(preguntas));
    expect(resultado.avisos.length).toBeGreaterThan(0);
    expect(resultado.preguntas.length).toBeLessThan(preguntas.length === 2 ? 2 : 1);
  });

  it('un tema cuyo id no coincide con la carpeta se omite', () => {
    const resultado = armar({
      temas: { otra: { tema: temaBase, preguntas: [], datos: {} } },
      fichas: {},
    });
    expect(resultado.temas).toEqual([]);
    expect(resultado.avisos[0]).toContain('no coincide');
  });

  it('una ficha mal formada se omite pero el resto sigue', () => {
    const resultado = armar({
      temas: {},
      fichas: { rota: { tipo: 'tabla' }, ...fuentesFichaBuena() },
    });
    expect(resultado.avisos).toHaveLength(1);
    expect(Object.keys(resultado.fichas)).toEqual(['buena']);
  });

  it('las fichas y apoyos del temario cuentan como registrados', () => {
    const componente = (() => null) as never;
    const reg = crearRegistro({
      fichas: { conjugacion: componente },
      apoyos: { reloj: componente },
    });
    const resultado = armar(
      conPreguntas([
        { ...preguntaBase, ficha: { tipo: 'conjugacion', verbo: 'x' } },
        { ...preguntaBase, id: 'UNO-002', apoyo: { tipo: 'reloj', hora: '08:30' } },
      ]),
      reg,
    );
    expect(resultado.avisos).toEqual([]);
    expect(resultado.preguntas).toHaveLength(2);
  });

  it('los generadores producen preguntas normales validadas', () => {
    const generador: GeneradorPreguntas = {
      tema: 'uno',
      archivoDatos: 'palabras.json',
      generar: (datos) =>
        (datos as string[]).map((palabra, i) => ({
          ...preguntaBase,
          id: `UNO-G${i}`,
          enunciado: palabra,
          mantener_orden: true,
        })),
    };
    const fuentes = conPreguntas([]);
    fuentes.temas.uno!.datos['palabras.json'] = ['x', 'y'];
    const resultado = armar(fuentes, crearRegistro({ generadores: [generador] }));
    expect(resultado.avisos).toEqual([]);
    expect(resultado.preguntas.map((p) => p.id)).toEqual(['UNO-G0', 'UNO-G1']);
  });

  it('un generador sin su archivo de datos deja un aviso', () => {
    const generador: GeneradorPreguntas = {
      tema: 'uno',
      archivoDatos: 'falta.json',
      generar: () => [],
    };
    const resultado = armar(conPreguntas([]), crearRegistro({ generadores: [generador] }));
    expect(resultado.avisos[0]).toContain('falta.json');
  });

  it('descubre temas, fichas y traducciones por la ruta de los archivos', () => {
    const fuentes = fuentesDesdeModulos({
      '/t/contenido/temas/uno/tema.json': { a: 1 },
      '/t/contenido/temas/uno/preguntas.json': [1],
      '/t/contenido/temas/uno/datos.json': { b: 2 },
      '/t/contenido/fichas/f.json': { c: 3 },
      '/t/contenido/traducciones.json': { d: 4 },
    });
    expect(fuentes.temas.uno).toEqual({
      tema: { a: 1 },
      preguntas: [1],
      datos: { 'datos.json': { b: 2 } },
    });
    expect(fuentes.fichas).toEqual({ f: { c: 3 } });
    expect(fuentes.traducciones).toEqual({ d: 4 });
  });
});

function fuentesFichaBuena() {
  return {
    buena: { tipo: 'regla', titulo: 'T', puntos: [{ id: 'p', texto: 't' }] },
  };
}

function sinClave<T>(objeto: Record<string, T>, clave: string): Record<string, T> {
  return Object.fromEntries(Object.entries(objeto).filter(([k]) => k !== clave));
}

describe('agregar un tema es agregar una carpeta', () => {
  it('un tema nuevo aparece en el banco sin tocar código', () => {
    const fuentes = structuredClone(fuentesDelTest());
    fuentes.temas['historia'] = {
      tema: {
        id: 'historia',
        prefijo: 'HIS',
        orden: 3,
        nombre_corto: 'Historia',
        titulo: 'Historia',
        resumen: 'r',
        que_es: 'q',
        como_reconocerlo: [],
        ejemplos: [],
        errores_comunes: [],
      },
      preguntas: [1, 2, 3, 4, 5].flatMap((nivel) =>
        [1, 2].map((n) => ({
          id: `HIS-${nivel}${n}`,
          nivel,
          enunciado: '¿Pregunta?',
          opciones: ['a', 'b', 'c', 'd'],
          correcta: 'a',
          explicacion: 'porque sí',
        })),
      ),
      datos: {},
    };
    const resultado = armarBanco(fuentes, juegoPlantilla, registro, crearAleatorio(1));
    expect(resultado.avisos).toEqual([]);
    expect(resultado.temas.map((t) => t.id)).toEqual(['geografia', 'ciencia', 'historia']);
    expect(resultado.preguntas.filter((p) => p.tema === 'historia')).toHaveLength(10);
  });
});

describe('esquema de configuración del juego', () => {
  it('exige que premios y nivelPorPregunta tengan el mismo largo', () => {
    const lectura = esquemaJuego.safeParse({ ...juegoPlantilla, nivelPorPregunta: [1, 2] });
    expect(lectura.success).toBe(false);
  });

  it('exige segundos y rango de público para cada nivel usado', () => {
    const sinNivelCinco = sinClave(juegoPlantilla.segundosPorNivel, '5');
    expect(
      esquemaJuego.safeParse({ ...juegoPlantilla, segundosPorNivel: sinNivelCinco }).success,
    ).toBe(false);
    const rangosSin = sinClave(juegoPlantilla.rangosPublico, '5');
    expect(esquemaJuego.safeParse({ ...juegoPlantilla, rangosPublico: rangosSin }).success).toBe(
      false,
    );
  });

  it('rechaza rangos invertidos y seguros inexistentes', () => {
    expect(
      esquemaJuego.safeParse({
        ...juegoPlantilla,
        rangosPublico: { ...juegoPlantilla.rangosPublico, 1: [90, 10] },
      }).success,
    ).toBe(false);
    expect(esquemaJuego.safeParse({ ...juegoPlantilla, preguntasSeguras: [99] }).success).toBe(
      false,
    );
  });
});

describe('premios y textos', () => {
  it('da formato a la moneda configurada', () => {
    expect(
      formatearDinero({ simbolo: '$', separadorMiles: '.', simboloAntes: true }, 1500000),
    ).toBe('$ 1.500.000');
    expect(
      formatearDinero({ simbolo: 'pts', separadorMiles: ',', simboloAntes: false }, 2500),
    ).toBe('2,500 pts');
    expect(formatearDinero({ simbolo: '$', separadorMiles: '.', simboloAntes: true }, 0)).toBe(
      '$ 0',
    );
  });

  it('calcula la próxima pregunta segura', () => {
    expect(proximaSegura(juegoPlantilla, 1)).toBe(4);
    expect(proximaSegura(juegoPlantilla, 4)).toBe(8);
    expect(proximaSegura(juegoPlantilla, 8)).toBeNull();
  });

  it('el temario sobrescribe solo los textos que cambian', () => {
    const textos = mezclarTextos({ acierto: { titulo: 'Bien' }, victoria: 'Ganaste' });
    expect(textos.acierto.titulo).toBe('Bien');
    expect(textos.acierto.subtitulo).toBe(textosPorDefecto.acierto.subtitulo);
    expect(textos.victoria).toBe('Ganaste');
    expect(textos.fallo).toEqual(textosPorDefecto.fallo);
  });
});

describe('el motor no sabe de ningún temario', () => {
  function archivos(carpeta: string): string[] {
    return readdirSync(carpeta).flatMap((nombre) => {
      const ruta = path.join(carpeta, nombre);
      return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
    });
  }
  const fuentesDelMotor = archivos(path.resolve(import.meta.dirname, '../../src/motor'))
    .filter((ruta) => /\.(ts|svelte|css)$/.test(ruta))
    .map((ruta) => ({ ruta, texto: readFileSync(ruta, 'utf8') }));

  it('no contiene símbolos de moneda ni textos propios del alemán', () => {
    const prohibidos = /€|Richtig|Falsch|Game Over|Deutsch|Millionär|der_die_das/;
    const infractores = fuentesDelMotor
      .filter(({ texto }) => prohibidos.test(texto))
      .map((f) => f.ruta);
    expect(infractores).toEqual([]);
  });

  it('no importa nada de temarios/ (solo el alias @temario)', () => {
    const infractores = fuentesDelMotor
      .filter(({ texto }) => /from\s+['"][^'"]*temarios\//.test(texto))
      .map((f) => f.ruta);
    expect(infractores).toEqual([]);
  });
});
