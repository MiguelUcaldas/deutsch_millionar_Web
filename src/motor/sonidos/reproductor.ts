import { NOMBRES_SONIDO, type NombreSonido, type RutasSonido } from './rutas';

export interface Reproductor {
  /** Prepara el audio. Hay que llamarlo desde un gesto del jugador (clic o tecla) por la política de autoplay. */
  activar(): void;
  reproducir(nombre: NombreSonido): void;
  /** Corta todo lo que esté sonando. */
  detenerTodo(): void;
  /** Congela el audio donde está; `reanudar` continúa desde el mismo punto. */
  pausar(): void;
  reanudar(): void;
  destruir(): void;
}

/** No hace nada: pruebas y navegadores sin Web Audio. */
export const reproductorSilencioso: Reproductor = {
  activar() {},
  reproducir() {},
  detenerTodo() {},
  pausar() {},
  reanudar() {},
  destruir() {},
};

const unirRuta = (ruta: string) =>
  /^(https?:)?\/\//.test(ruta) ? ruta : `${import.meta.env.BASE_URL}${ruta.replace(/^\/+/, '')}`;

/**
 * Web Audio con los buffers ya decodificados: cada sonido arranca en el instante en que se pide,
 * sin la latencia de un `<audio>`. Si un archivo no carga, ese sonido simplemente no suena.
 */
export function crearReproductor(rutas: RutasSonido): Reproductor {
  if (typeof AudioContext === 'undefined') return reproductorSilencioso;

  let contexto: AudioContext | undefined;
  let pausado = false;
  const buffers = new Map<NombreSonido, AudioBuffer>();
  const sonando = new Set<AudioBufferSourceNode>();

  async function cargar(ctx: AudioContext) {
    await Promise.all(
      NOMBRES_SONIDO.map(async (nombre) => {
        try {
          const respuesta = await fetch(unirRuta(rutas[nombre]));
          if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
          buffers.set(nombre, await ctx.decodeAudioData(await respuesta.arrayBuffer()));
        } catch (error) {
          console.warn(`[sonidos] no se pudo cargar «${nombre}»:`, error);
        }
      }),
    );
  }

  return {
    activar() {
      if (!contexto) {
        contexto = new AudioContext();
        void cargar(contexto);
      }
      if (!pausado && contexto.state === 'suspended') void contexto.resume();
    },
    reproducir(nombre) {
      const buffer = buffers.get(nombre);
      if (!contexto || !buffer) return;
      const fuente = contexto.createBufferSource();
      fuente.buffer = buffer;
      fuente.connect(contexto.destination);
      fuente.onended = () => sonando.delete(fuente);
      sonando.add(fuente);
      fuente.start();
    },
    detenerTodo() {
      for (const fuente of sonando) {
        try {
          fuente.stop();
        } catch {
          // ya había terminado
        }
      }
      sonando.clear();
    },
    pausar() {
      pausado = true;
      void contexto?.suspend();
    },
    reanudar() {
      pausado = false;
      void contexto?.resume();
    },
    destruir() {
      this.detenerTodo();
      void contexto?.close();
      contexto = undefined;
    },
  };
}
