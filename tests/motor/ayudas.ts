import { armarBanco, fuentesDesdeModulos, type Banco } from '@motor/contenido/cargar';
import {
  esquemaConfiguracion,
  type ConfiguracionJuego,
  type Pregunta,
} from '@motor/contenido/esquemas';
import { crearRegistro } from '@motor/contenido/registro';
import { crearAleatorio } from '@motor/juego/aleatorio';
import {
  reducir,
  type Accion,
  type Contexto,
  type EstadoPartida,
  estadoInicial,
} from '@motor/juego/maquina';
import configuracionPlantilla from '../../temarios/plantilla/temario.config';

// Los tests del motor usan siempre el temario plantilla, sin importar TEMARIO.
const modulos = import.meta.glob(
  [
    '../../temarios/plantilla/contenido/temas/*/*.json',
    '../../temarios/plantilla/contenido/fichas/*.json',
    '../../temarios/plantilla/contenido/traducciones.json',
  ],
  { eager: true, import: 'default' },
);

export const configuracion = configuracionPlantilla;
export const juegoPlantilla: ConfiguracionJuego = configuracionPlantilla.juego;
/** Desde que se elige una opción hasta que empieza la revelación. */
export const suspensoTotalMs =
  juegoPlantilla.duracionesMs.suspensoSonando + juegoPlantilla.duracionesMs.suspensoSilencio;
export const registro = crearRegistro();

export const fuentesDelTest = () => fuentesDesdeModulos(modulos);

export function cargarBancoPlantilla(): Banco {
  return armarBanco(fuentesDelTest(), juegoPlantilla, registro, crearAleatorio(1));
}

export const banco = cargarBancoPlantilla();

export function crearContexto(semilla = 1, cambios: Partial<Contexto> = {}): Contexto {
  return {
    juego: juegoPlantilla,
    banco: banco.preguntas,
    aleatorio: crearAleatorio(semilla),
    ...cambios,
  };
}

export function todosLosTemas(): string[] {
  return banco.temas.map((t) => t.id);
}

export function comenzar(contexto: Contexto, temas = todosLosTemas()): EstadoPartida {
  return reducir(estadoInicial(), { tipo: 'comenzar', temasElegidos: temas }, contexto);
}

export function aplicar(
  estado: EstadoPartida,
  contexto: Contexto,
  ...acciones: Accion[]
): EstadoPartida {
  return acciones.reduce((actual, accion) => reducir(actual, accion, contexto), estado);
}

/** Responde y recorre suspenso → revelación → resultado. */
export function responderYVerResultado(
  estado: EstadoPartida,
  contexto: Contexto,
  opcion: string,
): EstadoPartida {
  return aplicar(
    estado,
    contexto,
    { tipo: 'responder', opcion },
    { tipo: 'finSuspenso' },
    { tipo: 'verResultado' },
  );
}

export function opcionIncorrecta(estado: EstadoPartida): string {
  const pregunta = estado.preguntaActual!;
  return estado.opcionesMostradas.find((o) => o !== pregunta.correcta)!;
}

export function preguntaDe(
  id: string,
  nivel: number,
  tema: string,
  extra: Partial<Pregunta> = {},
): Pregunta {
  return {
    id,
    tema,
    nivel,
    enunciado: `Enunciado ${id}`,
    opciones: ['a', 'b', 'c', 'd'],
    correcta: 'a',
    explicacion: 'x',
    ...extra,
  };
}

/** Configuración de juego derivada de la plantilla, con otro largo o niveles. */
export function juegoCon(cambios: Partial<ConfiguracionJuego>): ConfiguracionJuego {
  const juego = { ...juegoPlantilla, ...cambios };
  const lectura = esquemaConfiguracion.shape.juego.safeParse(juego);
  if (!lectura.success) throw new Error(lectura.error.message);
  return lectura.data;
}
