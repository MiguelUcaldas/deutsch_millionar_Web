import { getContext, setContext } from 'svelte';
import { armarBanco, type Banco, type FuentesContenido } from '../contenido/cargar';
import type { ConfiguracionTemario, Tema } from '../contenido/esquemas';
import { crearRegistro, type Registro } from '../contenido/registro';
import { barajar, crearAleatorio, type Aleatorio } from '../juego/aleatorio';
import { crearControlador, type Controlador } from '../juego/controlador';
import { alternarTemasDeValor, estadoDeValor, filasDeFiltro } from '../juego/filtros';
import { estadoInicial, premioObtenido, sePuedePausar, type EstadoPartida } from '../juego/maquina';
import { totalPreguntas } from '../juego/premios';
import { crearRelojPausable } from '../juego/relojPausable';
import { crearReproductor, reproductorSilencioso, type Reproductor } from '../sonidos/reproductor';
import { rutasDeSonido } from '../sonidos/rutas';
import { mezclarTextos, type Textos } from '../textos';
import { crearAlmacen } from './almacen';
import {
  leerProgreso,
  preguntasPendientes,
  registrarPartida,
  registrarRespuesta,
  temasMasFallados,
  type Progreso,
} from './progreso';
import { crearVoz } from './voz.svelte';

export type Apariencia = 'oscuro' | 'claro';
export type Vista = 'inicio' | 'repaso';

export interface ErrorDeDatos {
  archivo?: string;
  linea?: number;
  columna?: number;
  mensaje: string;
}

export interface OpcionesJuego {
  configuracion: ConfiguracionTemario;
  fuentes: FuentesContenido;
  /** Solo en pruebas: expone la respuesta correcta en un atributo `data-` y permite fijar la semilla. */
  modoPrueba?: boolean;
  semilla?: number;
  debug?: boolean;
  /** Solo en pruebas: muestra la pantalla de error de datos con un detalle de ejemplo. */
  forzarError?: boolean;
}

/** Todo lo que las pantallas necesitan: estado reactivo y las acciones del jugador. */
export function crearJuego(opciones: OpcionesJuego) {
  const { configuracion, fuentes, modoPrueba = false, debug = false } = opciones;
  const almacen = crearAlmacen(configuracion.id);
  const textos: Textos = mezclarTextos(configuracion.textos);
  const registro: Registro = crearRegistro(configuracion.extensiones);
  const aleatorio: Aleatorio =
    opciones.semilla === undefined ? Math.random : crearAleatorio(opciones.semilla);

  // ---------- progreso (récord, fallos y repaso espaciado) ----------
  let progreso = $state.raw<Progreso>(leerProgreso(almacen.leer('progreso')));
  const voz = crearVoz(configuracion.idiomaContenido);
  // Un solo reloj para todo lo que dura tiempo: al pausar se congela junto con la partida.
  const reloj = crearRelojPausable();
  // En las pruebas de pantallas el juego es mudo: no dependen del audio del navegador.
  const reproductor: Reproductor = modoPrueba
    ? reproductorSilencioso
    : crearReproductor(rutasDeSonido(configuracion.sonidos));

  /** Anota respuestas y partidas terminadas cuando la máquina cambia de fase. */
  function registrarProgreso(anterior: EstadoPartida, nuevo: EstadoPartida) {
    const reglas = configuracion.juego;
    let cambio = progreso;
    if (nuevo.fase === 'resultado' && anterior.fase !== 'resultado' && nuevo.preguntaActual) {
      cambio = registrarRespuesta(cambio, nuevo.preguntaActual, nuevo.acerto === true, Date.now());
    }
    const terminoPartida = nuevo.fase === 'victoria' || nuevo.fase === 'derrota';
    if (terminoPartida && anterior.fase !== nuevo.fase && !nuevo.practica) {
      const victoria = nuevo.fase === 'victoria';
      cambio = registrarPartida(cambio, {
        superadas: victoria ? totalPreguntas(reglas) : nuevo.numeroPregunta - 1,
        premio: premioObtenido(nuevo, reglas),
        victoria,
      });
    }
    if (cambio !== progreso) {
      progreso = cambio;
      almacen.escribir('progreso', progreso);
    }
  }

  // ---------- carga del contenido ----------
  let banco = $state.raw<Banco | null>(null);
  let errorDeDatos = $state.raw<ErrorDeDatos | null>(null);
  let controlador: Controlador | null = null;

  let estado = $state.raw<EstadoPartida>(estadoInicial());
  let segundos = $state(0);
  let eventos = $state.raw<string[]>([]);

  function registrar(mensaje: string) {
    if (!debug) return;
    const transcurrido = (performance.now() / 1000).toFixed(2);
    eventos = [...eventos.slice(-199), `[+${transcurrido}s] ${mensaje}`];
  }

  function cargar() {
    controlador?.destruir();
    controlador = null;
    errorDeDatos = null;
    estado = estadoInicial();
    try {
      const armado = armarBanco(fuentes, configuracion.juego, registro, aleatorio);
      for (const aviso of armado.avisos) console.warn(`[contenido] ${aviso}`);
      if (armado.preguntas.length === 0) {
        throw new Error('No se encontró ninguna pregunta válida en el temario.');
      }
      banco = armado;
      controlador = crearControlador({
        juego: configuracion.juego,
        banco: armado.preguntas,
        aleatorio,
        reproductor,
        reloj,
        alRegistrar: registrar,
      });
      controlador.suscribir((nuevo, restantes) => {
        const anterior = estado;
        estado = nuevo;
        segundos = restantes;
        registrarProgreso(anterior, nuevo);
      });
    } catch (error) {
      banco = null;
      errorDeDatos = { mensaje: error instanceof Error ? error.message : String(error) };
    }
  }
  cargar();
  if (opciones.forzarError) {
    errorDeDatos = {
      archivo: 'temas/acusativo/preguntas.json',
      linea: 48,
      columna: 7,
      mensaje: 'Se esperaba una coma o una llave de cierre.',
    };
  }

  // ---------- preferencias ----------
  const idsDeTemas = () => banco?.temas.map((t) => t.id) ?? [];
  const guardados = almacen.leer<string[]>('temas');
  let temasElegidos = $state<string[]>(
    guardados ? idsDeTemas().filter((id) => guardados.includes(id)) : idsDeTemas(),
  );

  // Las fichas de nivel solo marcan y desmarcan casillas: su estado sale de `temasElegidos`, no se guarda.
  const dimensionesDeFiltro = configuracion.filtrosTemas ?? [];
  // Versiones anteriores guardaban un filtro aparte; ya no se usa.
  almacen.borrar('filtros');

  const preferida = almacen.leer<Apariencia>('apariencia');
  const sistemaPrefiereClaro =
    typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
  let apariencia = $state<Apariencia>(preferida ?? (sistemaPrefiereClaro ? 'claro' : 'oscuro'));

  $effect.root(() => {
    $effect(() => {
      document.documentElement.dataset.theme = apariencia;
    });
    // En pausa se congelan también las animaciones CSS (ver base.css).
    $effect(() => {
      document.documentElement.classList?.toggle('en-pausa', estado.pausada);
    });
  });

  // ---------- navegación auxiliar ----------
  let vista = $state<Vista>('inicio');
  let temaAbierto = $state.raw<Tema | null>(null);
  let aviso = $state<string | null>(null);
  let temporizadorAviso: number | undefined;

  function mostrarAviso(texto: string) {
    aviso = texto;
    if (temporizadorAviso !== undefined) reloj.cancelar(temporizadorAviso);
    temporizadorAviso = reloj.programar(
      configuracion.juego.duracionesMs.aviso,
      () => (aviso = null),
    );
  }

  const minimo = configuracion.juego.minimoPreguntasPartida;

  return {
    configuracion,
    textos,
    registro,
    modoPrueba,
    debug,
    /** Código de idioma del contenido (`de`, `en`...) para el atributo lang; vacío si no aplica. */
    idioma: configuracion.idiomaContenido?.split('-')[0],

    get banco() {
      return banco;
    },
    get error() {
      return errorDeDatos;
    },
    get estado() {
      return estado;
    },
    get segundos() {
      return segundos;
    },
    get eventos() {
      return eventos;
    },

    /** La pantalla visible se deriva del estado de la partida. */
    get pantalla():
      | 'error'
      | 'inicio'
      | 'repaso'
      | 'pregunta'
      | 'resultado'
      | 'victoria'
      | 'derrota'
      | 'finPractica' {
      if (errorDeDatos || estado.fase === 'error') return 'error';
      switch (estado.fase) {
        case 'inicio':
          return vista;
        case 'pregunta':
        case 'suspenso':
        case 'revelacion':
          return 'pregunta';
        default:
          return estado.fase;
      }
    },
    get mensajeError(): ErrorDeDatos | null {
      return errorDeDatos ?? (estado.mensajeError ? { mensaje: estado.mensajeError } : null);
    },

    get vista() {
      return vista;
    },
    irA(nueva: Vista) {
      vista = nueva;
    },

    // ----- temas -----
    get temasElegidos() {
      return temasElegidos;
    },
    elegirTema(id: string, marcado: boolean) {
      temasElegidos = marcado
        ? temasElegidos.includes(id)
          ? temasElegidos
          : [...temasElegidos, id]
        : temasElegidos.filter((t) => t !== id);
      almacen.escribir('temas', temasElegidos);
    },
    elegirTodos(marcar: boolean) {
      temasElegidos = marcar ? idsDeTemas() : [];
      almacen.escribir('temas', temasElegidos);
    },
    // ----- selección rápida por nivel (u otra dimensión del temario) -----
    /** Las filas de fichas a mostrar (vacío si el temario no declara filtros o no distinguen nada). */
    get filasDeFiltro() {
      return filasDeFiltro(dimensionesDeFiltro, banco?.temas ?? []);
    },
    /** Todos, algunos o ninguno de los temas de ese valor están marcados. */
    estadoDeFicha(dimension: string, valor: string) {
      const definicion = dimensionesDeFiltro.find((d) => d.id === dimension);
      if (!definicion) return 'ninguno';
      return estadoDeValor(banco?.temas ?? [], temasElegidos, definicion, valor);
    },
    /** Marca los temas de la ficha (en una dimensión acumulativa, también los de los niveles anteriores), o los desmarca si ya estaban todos marcados. */
    alternarNivel(dimension: string, valor: string) {
      const definicion = dimensionesDeFiltro.find((d) => d.id === dimension);
      if (!definicion) return;
      temasElegidos = alternarTemasDeValor(banco?.temas ?? [], temasElegidos, definicion, valor);
      almacen.escribir('temas', temasElegidos);
    },
    preguntasEnTema(id: string): number {
      return banco?.preguntas.filter((p) => p.tema === id).length ?? 0;
    },
    get disponibles(): number {
      return banco?.preguntas.filter((p) => temasElegidos.includes(p.tema)).length ?? 0;
    },
    get alcanzaElMinimo(): boolean {
      return this.disponibles >= minimo;
    },
    minimo,

    temaDe(id: string): Tema | undefined {
      return banco?.temas.find((t) => t.id === id);
    },
    get temaAbierto() {
      return temaAbierto;
    },
    abrirTema(tema: Tema) {
      temaAbierto = tema;
    },
    cerrarTema() {
      temaAbierto = null;
    },

    // ----- apariencia -----
    get apariencia() {
      return apariencia;
    },
    alternarApariencia() {
      apariencia = apariencia === 'oscuro' ? 'claro' : 'oscuro';
      almacen.escribir('apariencia', apariencia);
    },

    // ----- aviso -----
    get aviso() {
      return aviso;
    },

    // ----- acciones de la partida -----
    comenzar() {
      if (!this.alcanzaElMinimo) return;
      reproductor.activar();
      controlador?.despachar({ tipo: 'comenzar', temasElegidos: [...temasElegidos] });
    },
    responder(opcion: string) {
      controlador?.despachar({ tipo: 'responder', opcion });
    },
    usarCincuenta() {
      controlador?.despachar({ tipo: 'usarCincuenta' });
    },
    usarPublico() {
      controlador?.despachar({ tipo: 'usarPublico' });
    },
    usarCambiar() {
      const antes = estado;
      controlador?.despachar({ tipo: 'usarCambiar' });
      const sinReemplazo =
        estado === antes &&
        antes.fase === 'pregunta' &&
        !antes.publicoEnCurso &&
        !antes.comodinesUsados.includes('cambiar');
      if (sinReemplazo) mostrarAviso(textos.sinReemplazo);
    },
    siguiente() {
      controlador?.despachar({ tipo: 'siguiente' });
    },
    // ----- pausa -----
    get pausada(): boolean {
      return estado.pausada;
    },
    get puedePausar(): boolean {
      return sePuedePausar(estado);
    },
    pausar() {
      controlador?.despachar({ tipo: 'pausar' });
    },
    reanudar() {
      controlador?.despachar({ tipo: 'reanudar' });
    },
    alternarPausa() {
      controlador?.despachar({ tipo: estado.pausada ? 'reanudar' : 'pausar' });
    },
    /** Para lo que debe congelarse con la pausa (p. ej. la flecha de una tabla). */
    reloj,

    nuevaPartida() {
      aviso = null;
      temaAbierto = null;
      vista = 'inicio';
      controlador?.despachar({ tipo: 'nuevaPartida' });
    },
    /** Vuelve a leer el contenido (útil tras un error de datos). */
    reintentar() {
      cargar();
      vista = 'inicio';
    },

    // ----- práctica y repaso espaciado -----
    /** Preguntas de un tema de menor a mayor nivel, mezcladas dentro de cada nivel. */
    practicarTema(id: string) {
      const tema = banco?.temas.find((t) => t.id === id);
      if (!banco || !tema) return;
      const ordenadas = barajar(
        banco.preguntas.filter((p) => p.tema === id),
        aleatorio,
      ).sort((a, b) => a.nivel - b.nivel);
      temaAbierto = null;
      reproductor.activar();
      controlador?.despachar({
        tipo: 'comenzarPractica',
        titulo: tema.nombre_corto,
        preguntas: ordenadas.map((p) => p.id),
      });
    },
    /** Practica lo que se falló y ya toca repasar. */
    repasarFallos() {
      const ids = this.pendientes;
      if (ids.length === 0) return;
      reproductor.activar();
      controlador?.despachar({
        tipo: 'comenzarPractica',
        titulo: textos.repasoFallosTitulo,
        preguntas: ids,
      });
    },
    terminarPractica() {
      controlador?.despachar({ tipo: 'terminarPractica' });
    },
    practicarDeNuevo() {
      const practica = estado.practica;
      if (!practica) return;
      reproductor.activar();
      controlador?.despachar({ tipo: 'nuevaPartida' });
      controlador?.despachar({
        tipo: 'comenzarPractica',
        titulo: practica.titulo,
        preguntas: practica.cola,
      });
    },

    // ----- progreso -----
    get progreso() {
      return progreso;
    },
    /** Ids de preguntas falladas que ya toca repasar (solo las que siguen existiendo en el banco). */
    get pendientes(): string[] {
      const ids = banco?.preguntas.map((p) => p.id) ?? [];
      return preguntasPendientes(progreso, Date.now()).filter((id) => ids.includes(id));
    },
    get temasFallados() {
      return temasMasFallados(progreso).map((t) => ({
        ...t,
        nombre: banco?.temas.find((x) => x.id === t.tema)?.nombre_corto ?? t.tema,
      }));
    },
    get hayProgreso(): boolean {
      return progreso.partidas > 0 || Object.keys(progreso.temas).length > 0;
    },
    borrarProgreso() {
      progreso = leerProgreso(null);
      almacen.escribir('progreso', progreso);
    },

    // ----- voz -----
    voz,

    destruir() {
      controlador?.destruir();
      reproductor.destruir();
      voz.destruir();
      if (temporizadorAviso !== undefined) reloj.cancelar(temporizadorAviso);
    },
  };
}

export type Juego = ReturnType<typeof crearJuego>;

const CLAVE = Symbol('juego');
export const proveerJuego = (juego: Juego) => setContext(CLAVE, juego);
export const obtenerJuego = () => getContext<Juego>(CLAVE);
