import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fuentesDesdeModulos } from '@motor/contenido/cargar';
import type { ConfiguracionTemario } from '@motor/contenido/esquemas';
import { crearJuego } from '@motor/estado/juego.svelte';
import { configuracion, juegoPlantilla, suspensoTotalMs } from './ayudas';

// Se usa el mismo contenido de la plantilla que el resto de pruebas del motor.
const modulos = import.meta.glob(
  [
    '../../temarios/plantilla/contenido/temas/*/*.json',
    '../../temarios/plantilla/contenido/fichas/*.json',
    '../../temarios/plantilla/contenido/traducciones.json',
  ],
  { eager: true, import: 'default' },
);

const fuentes = fuentesDesdeModulos(modulos);

function almacenFalso(inicial: Record<string, string> = {}) {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (clave: string) => datos[clave] ?? null,
    setItem: (clave: string, valor: string) => {
      datos[clave] = valor;
    },
  };
}

describe('estado del juego', () => {
  let almacen: ReturnType<typeof almacenFalso>;
  const destruir: (() => void)[] = [];

  function crear(opciones: { temas?: string[]; configuracionPropia?: ConfiguracionTemario } = {}) {
    if (opciones.temas) {
      almacen.datos['millonario:plantilla:temas'] = JSON.stringify(opciones.temas);
    }
    const juego = crearJuego({
      configuracion: opciones.configuracionPropia ?? configuracion,
      fuentes,
      semilla: 4,
      modoPrueba: true,
    });
    destruir.push(() => juego.destruir());
    return juego;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    almacen = almacenFalso();
    vi.stubGlobal('localStorage', almacen);
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
  });
  afterEach(() => {
    destruir.splice(0).forEach((f) => f());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('carga el banco y arranca en la pantalla de inicio con todos los temas', () => {
    const juego = crear();
    expect(juego.pantalla).toBe('inicio');
    expect(juego.banco?.preguntas).toHaveLength(20);
    expect(juego.temasElegidos).toEqual(['geografia', 'ciencia']);
    expect(juego.disponibles).toBe(20);
    expect(juego.alcanzaElMinimo).toBe(true);
  });

  it('recuerda la selección de temas con el prefijo del temario', () => {
    const juego = crear();
    juego.elegirTema('ciencia', false);
    expect(JSON.parse(almacen.datos['millonario:plantilla:temas']!)).toEqual(['geografia']);
    const otro = crear();
    expect(otro.temasElegidos).toEqual(['geografia']);
    otro.elegirTodos(false);
    expect(JSON.parse(almacen.datos['millonario:plantilla:temas']!)).toEqual([]);
  });

  it('descarta temas guardados que ya no existen', () => {
    const juego = crear({ temas: ['geografia', 'tema_borrado'] });
    expect(juego.temasElegidos).toEqual(['geografia']);
  });

  it('no comienza si no se alcanza el mínimo de preguntas', () => {
    const juego = crear({
      configuracionPropia: {
        ...configuracion,
        juego: { ...juegoPlantilla, minimoPreguntasPartida: 15 },
      },
    });
    juego.elegirTema('ciencia', false);
    expect(juego.disponibles).toBe(10);
    expect(juego.alcanzaElMinimo).toBe(false);
    juego.comenzar();
    expect(juego.pantalla).toBe('inicio');
  });

  it('la pantalla se deriva de la fase de la partida', () => {
    const juego = crear();
    juego.irA('repaso');
    expect(juego.pantalla).toBe('repaso');
    juego.irA('inicio');
    juego.comenzar();
    expect(juego.pantalla).toBe('pregunta');
    juego.responder(juego.estado.preguntaActual!.correcta);
    expect(juego.pantalla).toBe('pregunta'); // suspenso
    vi.advanceTimersByTime(suspensoTotalMs + 10);
    expect(juego.pantalla).toBe('pregunta'); // revelación
    vi.advanceTimersByTime(juegoPlantilla.duracionesMs.antesDeResultado + 10);
    expect(juego.pantalla).toBe('resultado');
    juego.siguiente();
    expect(juego.pantalla).toBe('pregunta');
  });

  it('Cambiar sin pregunta de reemplazo muestra un aviso que desaparece y no gasta el comodín', () => {
    // Un solo tema con 2 preguntas por nivel: en la pregunta 4 (segunda del nivel 2) ya no queda otra.
    const juego = crear({ temas: ['geografia'], configuracionPropia: configuracionDeUnTema() });
    juego.comenzar();
    for (let i = 0; i < 3; i++) {
      juego.responder(juego.estado.preguntaActual!.correcta);
      vi.advanceTimersByTime(suspensoTotalMs + juegoPlantilla.duracionesMs.antesDeResultado + 20);
      juego.siguiente();
    }
    expect(juego.estado.numeroPregunta).toBe(4);
    const antes = juego.estado.preguntaActual!.id;
    juego.usarCambiar();
    expect(juego.aviso).toBe('No hay otra pregunta disponible del mismo nivel.');
    expect(juego.estado.comodinesUsados).not.toContain('cambiar');
    expect(juego.estado.preguntaActual!.id).toBe(antes);
    vi.advanceTimersByTime(juegoPlantilla.duracionesMs.aviso + 10);
    expect(juego.aviso).toBeNull();
  });

  it('un comodín ya usado no genera aviso al repetirse', () => {
    const juego = crear();
    juego.comenzar();
    juego.usarCambiar();
    expect(juego.estado.comodinesUsados).toContain('cambiar');
    juego.usarCambiar();
    expect(juego.aviso).toBeNull();
  });

  it('nueva partida limpia el estado y vuelve al inicio', () => {
    const juego = crear();
    juego.comenzar();
    juego.nuevaPartida();
    expect(juego.pantalla).toBe('inicio');
    expect(juego.estado.preguntaActual).toBeNull();
  });

  it('alterna y recuerda la apariencia', () => {
    const juego = crear();
    expect(juego.apariencia).toBe('oscuro');
    juego.alternarApariencia();
    expect(juego.apariencia).toBe('claro');
    expect(JSON.parse(almacen.datos['millonario:plantilla:apariencia']!)).toBe('claro');
  });

  it('sin localStorage el juego funciona igual', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    const juego = crear();
    juego.elegirTema('ciencia', false);
    juego.alternarApariencia();
    juego.comenzar();
    expect(juego.pantalla).toBe('pregunta'); // 10 preguntas alcanzan el mínimo exacto
    expect(juego.temasElegidos).toEqual(['geografia']);
  });

  it('un contenido sin preguntas muestra el error de datos y reintentar lo recupera', () => {
    const juego = crearJuego({
      configuracion,
      fuentes: { temas: {}, fichas: {} },
      modoPrueba: true,
    });
    destruir.push(() => juego.destruir());
    expect(juego.pantalla).toBe('error');
    expect(juego.mensajeError?.mensaje).toContain('ninguna pregunta');
  });

  it('modoPrueba y debug quedan registrados', () => {
    const juego = crearJuego({ configuracion, fuentes, modoPrueba: true, debug: true });
    destruir.push(() => juego.destruir());
    juego.comenzar();
    expect(juego.eventos.some((e) => e.includes('comenzar: inicio → pregunta'))).toBe(true);
  });
});

describe('progreso, práctica y voz en el estado del juego', () => {
  let almacen: ReturnType<typeof almacenFalso>;
  const destruir: (() => void)[] = [];
  const { antesDeResultado } = juegoPlantilla.duracionesMs;

  function crear(configuracionPropia: ConfiguracionTemario = configuracion) {
    const juego = crearJuego({
      configuracion: configuracionPropia,
      fuentes,
      semilla: 6,
      modoPrueba: true,
    });
    destruir.push(() => juego.destruir());
    return juego;
  }
  const responder = (juego: ReturnType<typeof crear>, correcta: boolean) => {
    const pregunta = juego.estado.preguntaActual!;
    juego.responder(
      correcta
        ? pregunta.correcta
        : juego.estado.opcionesMostradas.find((o) => o !== pregunta.correcta)!,
    );
    vi.advanceTimersByTime(suspensoTotalMs + antesDeResultado + 20);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    almacen = almacenFalso();
    vi.stubGlobal('localStorage', almacen);
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
  });
  afterEach(() => {
    destruir.splice(0).forEach((f) => f());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('registra respuestas y partidas, las guarda y las recupera al volver', () => {
    const juego = crear();
    expect(juego.hayProgreso).toBe(false);
    juego.comenzar();
    responder(juego, true);
    juego.siguiente();
    const fallada = juego.estado.preguntaActual!;
    responder(juego, false);
    juego.siguiente();
    expect(juego.pantalla).toBe('derrota');

    expect(juego.progreso.partidas).toBe(1);
    expect(juego.progreso.mejorPregunta).toBe(1);
    expect(Object.keys(juego.progreso.preguntas)).toEqual([fallada.id]);
    expect(juego.hayProgreso).toBe(true);
    expect(juego.pendientes).toEqual([fallada.id]);

    const guardado = JSON.parse(almacen.datos['millonario:plantilla:progreso']!);
    expect(guardado.partidas).toBe(1);
    expect(crear().progreso.partidas).toBe(1);
  });

  it('una victoria suma el récord completo', () => {
    const juego = crear();
    juego.comenzar();
    while (juego.pantalla === 'pregunta') {
      responder(juego, true);
      juego.siguiente();
    }
    expect(juego.pantalla).toBe('victoria');
    expect(juego.progreso).toMatchObject({ partidas: 1, victorias: 1, mejorPregunta: 10 });
    expect(juego.progreso.mejorPremio).toBe(juegoPlantilla.premios.at(-1));
  });

  it('el tiempo agotado cuenta como fallo', () => {
    const juego = crear();
    juego.comenzar();
    vi.advanceTimersByTime(31_000);
    expect(Object.keys(juego.progreso.preguntas)).toHaveLength(1);
  });

  it('repasar lo fallado practica solo esas preguntas y, al acertarlas, se espacian', () => {
    const juego = crear();
    juego.comenzar();
    const fallada = juego.estado.preguntaActual!.id;
    responder(juego, false);
    juego.siguiente();
    juego.nuevaPartida();

    juego.repasarFallos();
    expect(juego.pantalla).toBe('pregunta');
    expect(juego.estado.practica!.cola).toEqual([fallada]);
    expect(juego.estado.preguntaActual!.id).toBe(fallada);
    responder(juego, true);
    expect(juego.progreso.preguntas[fallada]!.caja).toBe(1);
    expect(juego.pendientes).toEqual([]);
    juego.siguiente();
    expect(juego.pantalla).toBe('finPractica');
    // Practicar de nuevo reinicia la misma cola.
    juego.practicarDeNuevo();
    expect(juego.pantalla).toBe('pregunta');
    expect(juego.estado.practica).toMatchObject({ respondidas: 0, aciertos: 0 });
  });

  it('practicar un tema ordena sus preguntas de menor a mayor nivel', () => {
    const juego = crear();
    juego.practicarTema('ciencia');
    const cola = juego.estado.practica!.cola;
    expect(cola).toHaveLength(10);
    const niveles = cola.map((id) => juego.banco!.preguntas.find((p) => p.id === id)!.nivel);
    expect(niveles).toEqual([...niveles].sort((a, b) => a - b));
    expect(juego.estado.practica!.titulo).toBe('Ciencia');
  });

  it('practicar no cuenta como partida pero sí como respuestas', () => {
    const juego = crear();
    juego.practicarTema('geografia');
    responder(juego, true);
    juego.terminarPractica();
    expect(juego.pantalla).toBe('finPractica');
    expect(juego.progreso.partidas).toBe(0);
    expect(juego.progreso.temas['geografia']).toEqual({ aciertos: 1, fallos: 0 });
  });

  it('borrar el progreso lo deja vacío y lo guarda', () => {
    const juego = crear();
    juego.comenzar();
    responder(juego, false);
    expect(juego.hayProgreso).toBe(true);
    juego.borrarProgreso();
    expect(juego.hayProgreso).toBe(false);
    expect(JSON.parse(almacen.datos['millonario:plantilla:progreso']!).partidas).toBe(0);
  });

  it('con un progreso guardado dañado empieza de cero', () => {
    almacen.datos['millonario:plantilla:progreso'] = '{"version": 9}';
    expect(crear().hayProgreso).toBe(false);
  });

  describe('voz', () => {
    const conVoz = (idioma: string): ConfiguracionTemario => ({
      ...configuracion,
      idiomaContenido: idioma,
    });
    function simularVoces(langs: string[]) {
      const dichos: { texto: string; lang: string }[] = [];
      class Emision {
        lang = '';
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      }
      vi.stubGlobal('SpeechSynthesisUtterance', Emision);
      vi.stubGlobal('speechSynthesis', {
        getVoices: () => langs.map((lang) => ({ lang })),
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {},
        speak: (e: InstanceType<typeof Emision>) => dichos.push({ texto: e.text, lang: e.lang }),
      });
      return dichos;
    }

    it('está disponible solo si hay una voz del idioma del contenido', () => {
      simularVoces(['en-US', 'de-DE']);
      expect(crear(conVoz('de-DE')).voz.disponible).toBe(true);
      simularVoces(['en-US']);
      expect(crear(conVoz('de-DE')).voz.disponible).toBe(false);
    });

    it('sin idioma de contenido nunca está disponible', () => {
      simularVoces(['de-DE']);
      expect(crear().voz.disponible).toBe(false);
    });

    it('lee el texto con el idioma completo y se puede detener', () => {
      const dichos = simularVoces(['de-DE']);
      const juego = crear(conVoz('de-DE'));
      juego.voz.hablar('Ich habe einen Hund.');
      expect(dichos).toEqual([{ texto: 'Ich habe einen Hund.', lang: 'de-DE' }]);
      expect(juego.voz.hablando).toBe(true);
      juego.voz.detener();
      expect(juego.voz.hablando).toBe(false);
    });

    it('sin soporte del navegador no rompe nada', () => {
      const juego = crear(conVoz('de-DE'));
      expect(juego.voz.disponible).toBe(false);
      juego.voz.hablar('hola');
      juego.voz.detener();
    });
  });
});

function configuracionDeUnTema(): ConfiguracionTemario {
  return { ...configuracion, juego: { ...juegoPlantilla, minimoPreguntasPartida: 10 } };
}
