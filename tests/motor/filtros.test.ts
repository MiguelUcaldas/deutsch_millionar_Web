import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fuentesDesdeModulos } from '@motor/contenido/cargar';
import type { ConfiguracionTemario } from '@motor/contenido/esquemas';
import { validarContenido } from '@motor/contenido/validar';
import { crearJuego } from '@motor/estado/juego.svelte';
import { alternarTemasDeValor, estadoDeValor, filasDeFiltro } from '@motor/juego/filtros';
import { configuracion, juegoPlantilla, suspensoTotalMs } from './ayudas';

const modulos = import.meta.glob(
  [
    '../../temarios/plantilla/contenido/temas/*/*.json',
    '../../temarios/plantilla/contenido/fichas/*.json',
    '../../temarios/plantilla/contenido/traducciones.json',
  ],
  { eager: true, import: 'default' },
);
const fuentes = fuentesDesdeModulos(modulos);
// Los dos temas con el mismo valor («Fácil»), para probar el estado mixto de una ficha.
const fuentesMismoValor = fuentesDesdeModulos(
  Object.fromEntries(
    Object.entries(modulos).map(([ruta, contenido]) =>
      ruta.endsWith('/ciencia/tema.json')
        ? [ruta, { ...(contenido as object), filtros: { dificultad: 'Fácil' } }]
        : [ruta, contenido],
    ),
  ),
);

const nivel = { id: 'nivel', etiqueta: 'Nivel', valores: ['A1', 'A2', 'B1'] };
const temasDeEjemplo = [
  { id: 'uno', filtros: { nivel: 'A1' } },
  { id: 'dos', filtros: { nivel: 'A1' } },
  { id: 'tres', filtros: { nivel: 'A2' } },
];

describe('fichas de selección rápida', () => {
  it('solo muestra los valores que tienen temas, en el orden del temario', () => {
    expect(filasDeFiltro([nivel], temasDeEjemplo)).toEqual([
      { id: 'nivel', etiqueta: 'Nivel', valores: ['A1', 'A2'] },
    ]);
  });

  it('una dimensión con un solo valor con temas no muestra su fila', () => {
    expect(filasDeFiltro([nivel], [{ id: 'uno', filtros: { nivel: 'A1' } }])).toEqual([]);
    expect(filasDeFiltro([], temasDeEjemplo)).toEqual([]);
  });

  it('el estado de la ficha sale de las casillas: todos, algunos o ninguno', () => {
    const todos = ['uno', 'dos', 'tres'];
    expect(estadoDeValor(temasDeEjemplo, todos, 'nivel', 'A1')).toBe('todos');
    expect(estadoDeValor(temasDeEjemplo, ['uno', 'tres'], 'nivel', 'A1')).toBe('algunos');
    expect(estadoDeValor(temasDeEjemplo, ['tres'], 'nivel', 'A1')).toBe('ninguno');
    expect(estadoDeValor(temasDeEjemplo, [], 'nivel', 'A2')).toBe('ninguno');
    // Un valor sin temas nunca está «todos».
    expect(estadoDeValor(temasDeEjemplo, todos, 'nivel', 'B1')).toBe('ninguno');
  });

  it('pulsar con todos marcados los desmarca, y solo los de su valor', () => {
    const todos = ['uno', 'dos', 'tres'];
    expect(alternarTemasDeValor(temasDeEjemplo, todos, 'nivel', 'A2')).toEqual(['uno', 'dos']);
    expect(alternarTemasDeValor(temasDeEjemplo, todos, 'nivel', 'A1')).toEqual(['tres']);
  });

  it('pulsar con alguno sin marcar los marca todos, sin tocar los demás', () => {
    expect(alternarTemasDeValor(temasDeEjemplo, ['uno', 'tres'], 'nivel', 'A1')).toEqual([
      'uno',
      'tres',
      'dos',
    ]);
    expect(alternarTemasDeValor(temasDeEjemplo, [], 'nivel', 'A2')).toEqual(['tres']);
    expect(alternarTemasDeValor(temasDeEjemplo, ['tres'], 'nivel', 'A1')).toEqual([
      'tres',
      'uno',
      'dos',
    ]);
  });
});

describe('selección rápida en el estado del juego (plantilla: geografía «Fácil», ciencia «Medio»)', () => {
  const almacen: Record<string, string> = {};
  const destruir: (() => void)[] = [];

  function crear(
    configuracionPropia: ConfiguracionTemario = configuracion,
    fuentesPropias = fuentes,
  ) {
    const juego = crearJuego({
      configuracion: configuracionPropia,
      fuentes: fuentesPropias,
      semilla: 3,
      modoPrueba: true,
    });
    destruir.push(() => juego.destruir());
    return juego;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    for (const clave of Object.keys(almacen)) delete almacen[clave];
    vi.stubGlobal('localStorage', {
      getItem: (clave: string) => almacen[clave] ?? null,
      setItem: (clave: string, valor: string) => {
        almacen[clave] = valor;
      },
      removeItem: (clave: string) => {
        delete almacen[clave];
      },
    });
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
  });
  afterEach(() => {
    destruir.splice(0).forEach((f) => f());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('con todo marcado hay una fila con los dos valores y las dos fichas están activas', () => {
    const juego = crear();
    expect(juego.filasDeFiltro).toEqual([
      { id: 'dificultad', etiqueta: 'Dificultad', valores: ['Fácil', 'Medio'] },
    ]);
    expect(juego.estadoDeFicha('dificultad', 'Fácil')).toBe('todos');
    expect(juego.estadoDeFicha('dificultad', 'Medio')).toBe('todos');
  });

  it('pulsar una ficha marca o desmarca solo los temas de su valor, y siempre se ven todos', () => {
    const juego = crear();
    juego.alternarNivel('dificultad', 'Medio');
    expect(juego.temasElegidos).toEqual(['geografia']);
    expect(juego.estadoDeFicha('dificultad', 'Medio')).toBe('ninguno');
    expect(juego.estadoDeFicha('dificultad', 'Fácil')).toBe('todos');
    expect(juego.banco?.temas).toHaveLength(2);
    juego.alternarNivel('dificultad', 'Medio');
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
  });

  it('con un tema del valor desmarcado a mano la ficha queda mixta y al pulsarla marca todos', () => {
    const juego = crear(configuracion, fuentesMismoValor);
    juego.elegirTema('ciencia', false);
    expect(juego.estadoDeFicha('dificultad', 'Fácil')).toBe('algunos');
    juego.alternarNivel('dificultad', 'Fácil');
    expect(juego.estadoDeFicha('dificultad', 'Fácil')).toBe('todos');
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
    juego.alternarNivel('dificultad', 'Fácil');
    expect(juego.temasElegidos).toEqual([]);
  });

  it('las fichas se actualizan solas al marcar o desmarcar casillas a mano', () => {
    const juego = crear();
    juego.elegirTema('ciencia', false);
    expect(juego.estadoDeFicha('dificultad', 'Medio')).toBe('ninguno');
    juego.elegirTema('ciencia', true);
    expect(juego.estadoDeFicha('dificultad', 'Medio')).toBe('todos');
    juego.elegirTodos(false);
    expect(juego.estadoDeFicha('dificultad', 'Fácil')).toBe('ninguno');
    juego.elegirTodos(true);
    expect(juego.estadoDeFicha('dificultad', 'Fácil')).toBe('todos');
  });

  it('las preguntas disponibles y el mínimo se actualizan con las fichas', () => {
    const juego = crear();
    expect(juego.disponibles).toBe(20);
    juego.alternarNivel('dificultad', 'Medio');
    expect(juego.disponibles).toBe(10);
    expect(juego.alcanzaElMinimo).toBe(true);
    juego.alternarNivel('dificultad', 'Fácil');
    expect(juego.disponibles).toBe(0);
    expect(juego.alcanzaElMinimo).toBe(false);
    juego.comenzar();
    expect(juego.pantalla).toBe('inicio');
  });

  it('la partida usa los temas marcados', () => {
    const juego = crear();
    juego.alternarNivel('dificultad', 'Fácil');
    juego.comenzar();
    const vistos: string[] = [];
    while (juego.pantalla === 'pregunta') {
      vistos.push(juego.estado.preguntaActual!.tema);
      juego.responder(juego.estado.preguntaActual!.correcta);
      vi.advanceTimersByTime(suspensoTotalMs + juegoPlantilla.duracionesMs.antesDeResultado + 20);
      juego.siguiente();
    }
    expect(vistos).toHaveLength(juegoPlantilla.premios.length);
    expect(new Set(vistos)).toEqual(new Set(['ciencia']));
  });

  it('la selección se guarda como siempre y no se escribe ningún filtro aparte', () => {
    const juego = crear();
    juego.alternarNivel('dificultad', 'Medio');
    expect(JSON.parse(almacen['millonario:plantilla:temas']!)).toEqual(['geografia']);
    expect(almacen['millonario:plantilla:filtros']).toBeUndefined();
    expect(crear().estadoDeFicha('dificultad', 'Medio')).toBe('ninguno');
  });

  it('borra el filtro guardado por versiones anteriores', () => {
    almacen['millonario:plantilla:filtros'] = JSON.stringify({ dificultad: ['Medio'] });
    const juego = crear();
    expect(almacen['millonario:plantilla:filtros']).toBeUndefined();
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
  });

  it('sin filtrosTemas no hay fichas y pulsar una no hace nada, pero Todos y Ninguno siguen', () => {
    const juego = crear({ ...configuracion, filtrosTemas: undefined });
    expect(juego.filasDeFiltro).toEqual([]);
    juego.alternarNivel('dificultad', 'Fácil');
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
    juego.elegirTodos(false);
    expect(juego.temasElegidos).toEqual([]);
    juego.elegirTodos(true);
    expect(juego.disponibles).toBe(20);
  });
});

describe('validación de filtros', () => {
  const validar = (cambios: Partial<ConfiguracionTemario>) =>
    validarContenido(fuentes, { ...configuracion, ...cambios }).errores;

  it('el temario de la plantilla es válido', () => {
    expect(validar({})).toEqual([]);
  });

  it('falla si un tema no declara una dimensión del temario', () => {
    const errores = validar({
      filtrosTemas: [
        ...(configuracion.filtrosTemas ?? []),
        { id: 'tipo', etiqueta: 'Tipo', valores: ['a', 'b'] },
      ],
    });
    expect(errores).toEqual(
      expect.arrayContaining([
        expect.stringContaining('temas/geografia/tema.json → filtros.tipo: falta'),
        expect.stringContaining('temas/ciencia/tema.json → filtros.tipo: falta'),
      ]),
    );
  });

  it('falla si el valor no está en la lista del temario', () => {
    const errores = validar({
      filtrosTemas: [{ id: 'dificultad', etiqueta: 'Dificultad', valores: ['Fácil'] }],
    });
    expect(errores).toEqual([
      expect.stringContaining('temas/ciencia/tema.json → filtros.dificultad: «Medio» no está'),
    ]);
  });

  it('falla si un tema declara una dimensión que el temario no tiene', () => {
    const errores = validar({ filtrosTemas: undefined });
    expect(errores).toEqual(
      expect.arrayContaining([
        expect.stringContaining('filtros.dificultad: el temario no declara esa dimensión'),
      ]),
    );
  });
});
