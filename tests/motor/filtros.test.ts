import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fuentesDesdeModulos } from '@motor/contenido/cargar';
import type { ConfiguracionTemario } from '@motor/contenido/esquemas';
import { validarContenido } from '@motor/contenido/validar';
import { crearJuego } from '@motor/estado/juego.svelte';
import {
  alternarValor,
  filasDeFiltro,
  limpiarDimension,
  sanearSeleccion,
  temaCoincide,
} from '@motor/juego/filtros';
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

const nivel = { id: 'nivel', etiqueta: 'Nivel', valores: ['A1', 'A2', 'B1'] };
const temasDeEjemplo = [
  { filtros: { nivel: 'A1' } },
  { filtros: { nivel: 'A1' } },
  { filtros: { nivel: 'A2' } },
];

describe('funciones de filtro', () => {
  it('sin nada marcado todos los temas coinciden', () => {
    expect(temaCoincide({ filtros: { nivel: 'A1' } }, {})).toBe(true);
    expect(temaCoincide({}, {})).toBe(true);
    expect(temaCoincide({ filtros: { nivel: 'A1' } }, { nivel: [] })).toBe(true);
  });

  it('marcar valores deja solo los temas con alguno de ellos', () => {
    expect(temaCoincide({ filtros: { nivel: 'A1' } }, { nivel: ['A2'] })).toBe(false);
    expect(temaCoincide({ filtros: { nivel: 'A2' } }, { nivel: ['A1', 'A2'] })).toBe(true);
    expect(temaCoincide({}, { nivel: ['A1'] })).toBe(false);
  });

  it('las filas solo muestran los valores que tienen temas, en el orden del temario', () => {
    const filas = filasDeFiltro([nivel], temasDeEjemplo);
    expect(filas).toEqual([{ id: 'nivel', etiqueta: 'Nivel', valores: ['A1', 'A2'] }]);
  });

  it('una dimensión con un solo valor con temas no muestra su fila', () => {
    expect(filasDeFiltro([nivel], [{ filtros: { nivel: 'A1' } }])).toEqual([]);
    expect(filasDeFiltro([], temasDeEjemplo)).toEqual([]);
  });

  it('alterna valores y quita la dimensión cuando no queda ninguno', () => {
    let seleccion = alternarValor({}, 'nivel', 'A1');
    seleccion = alternarValor(seleccion, 'nivel', 'A2');
    expect(seleccion).toEqual({ nivel: ['A1', 'A2'] });
    seleccion = alternarValor(seleccion, 'nivel', 'A1');
    expect(seleccion).toEqual({ nivel: ['A2'] });
    expect(alternarValor(seleccion, 'nivel', 'A2')).toEqual({});
    expect(limpiarDimension({ nivel: ['A1'], otra: ['x'] }, 'nivel')).toEqual({ otra: ['x'] });
  });

  it('descarta lo guardado que ya no existe en el temario', () => {
    expect(sanearSeleccion({ nivel: ['A2', 'Z9'], vieja: ['x'] }, [nivel])).toEqual({
      nivel: ['A2'],
    });
    expect(sanearSeleccion('basura', [nivel])).toEqual({});
    expect(sanearSeleccion(null, [nivel])).toEqual({});
  });
});

describe('filtros en el estado del juego (plantilla: geografía «Fácil», ciencia «Medio»)', () => {
  const almacen: Record<string, string> = {};
  const destruir: (() => void)[] = [];

  function crear(configuracionPropia: ConfiguracionTemario = configuracion) {
    const juego = crearJuego({
      configuracion: configuracionPropia,
      fuentes,
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
    });
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
  });
  afterEach(() => {
    destruir.splice(0).forEach((f) => f());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sin filtro marcado se ven todos los temas y la fila de fichas tiene los dos valores', () => {
    const juego = crear();
    expect(juego.temasVisibles.map((t) => t.id)).toEqual(['geografia', 'ciencia']);
    expect(juego.filasDeFiltro).toEqual([
      { id: 'dificultad', etiqueta: 'Dificultad', valores: ['Fácil', 'Medio'] },
    ]);
    expect(juego.fueraPorFiltro).toBe(0);
  });

  it('filtrar oculta temas pero no cambia la selección guardada', () => {
    const juego = crear();
    juego.alternarFiltro('dificultad', 'Fácil');
    expect(juego.temasVisibles.map((t) => t.id)).toEqual(['geografia']);
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
    expect(almacen['millonario:plantilla:temas']).toBeUndefined();
    expect(JSON.parse(almacen['millonario:plantilla:filtros']!)).toEqual({
      dificultad: ['Fácil'],
    });
    juego.quitarFiltro('dificultad');
    expect(juego.temasVisibles).toHaveLength(2);
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
  });

  it('las preguntas disponibles, el mínimo y Comenzar usan solo los temas visibles', () => {
    const juego = crear();
    expect(juego.disponibles).toBe(20);
    juego.alternarFiltro('dificultad', 'Fácil');
    expect(juego.temasEnPartida).toEqual(['geografia']);
    expect(juego.disponibles).toBe(10);
    expect(juego.fueraPorFiltro).toBe(1);
    expect(juego.alcanzaElMinimo).toBe(true);

    // Con el único tema visible desmarcado no se llega al mínimo, aunque ciencia siga marcada.
    juego.elegirTema('geografia', false);
    expect(juego.disponibles).toBe(0);
    expect(juego.alcanzaElMinimo).toBe(false);
    juego.comenzar();
    expect(juego.pantalla).toBe('inicio');
  });

  it('«Todos» y «Ninguno» actúan solo sobre los temas visibles', () => {
    const juego = crear();
    juego.alternarFiltro('dificultad', 'Fácil');
    juego.elegirTodos(false);
    expect(juego.temasElegidos).toEqual(['ciencia']);
    juego.elegirTodos(true);
    expect(juego.temasElegidos).toEqual(['ciencia', 'geografia']);
    juego.alternarFiltro('dificultad', 'Medio');
    juego.elegirTodos(false);
    expect(juego.temasElegidos).toEqual([]);
  });

  it('la partida nunca incluye temas ocultos por el filtro', () => {
    const juego = crear();
    juego.alternarFiltro('dificultad', 'Medio');
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

  it('recuerda el filtro entre visitas y descarta valores que ya no existen', () => {
    crear().alternarFiltro('dificultad', 'Medio');
    expect(crear().filtros).toEqual({ dificultad: ['Medio'] });
    almacen['millonario:plantilla:filtros'] = JSON.stringify({
      dificultad: ['Imposible'],
      otra: ['x'],
    });
    expect(crear().filtros).toEqual({});
  });

  it('sin filtrosTemas en el temario no hay filas ni filtrado, aunque los temas traigan valores', () => {
    const juego = crear({ ...configuracion, filtrosTemas: undefined });
    expect(juego.filasDeFiltro).toEqual([]);
    juego.alternarFiltro('dificultad', 'Fácil');
    expect(juego.temasVisibles).toHaveLength(2);
    expect(juego.disponibles).toBe(20);
    expect(juego.fueraPorFiltro).toBe(0);
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
