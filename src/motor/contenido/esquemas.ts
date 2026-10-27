import { z } from 'zod';
import type { Component } from 'svelte';
import { NOMBRES_SONIDO } from '../sonidos/rutas.ts';
import type { Validador } from './validar';

// ---------- Contenido: temas, preguntas, fichas, traducciones ----------

const ejemplo = z.strictObject({ original: z.string().min(1), traduccion: z.string().min(1) });

export const esquemaTema = z.strictObject({
  $schema: z.string().optional(),
  id: z.string().regex(/^[a-z0-9_]+$/),
  prefijo: z.string().regex(/^[A-Z]+$/),
  orden: z.number().int(),
  nombre_corto: z.string().min(1),
  titulo: z.string().min(1),
  resumen: z.string().min(1),
  que_es: z.string().min(1),
  como_reconocerlo: z.array(z.string().min(1)),
  ejemplos: z.array(ejemplo),
  errores_comunes: z.array(z.string().min(1)),
  ficha_principal: z.string().optional(),
  /** Valor de cada dimensión de `filtrosTemas` del temario (p. ej. `{ "nivel": "A1" }`). */
  filtros: z.record(z.string(), z.string()).optional(),
});

/** Apoyo visual junto al enunciado. El motor solo exige `tipo`; el resto lo interpreta la extensión. */
const esquemaApoyo = z.looseObject({ tipo: z.string().min(1) });
/** Una ficha es el id de un archivo de `fichas/` o un objeto que resuelve una extensión. */
const esquemaFichaDePregunta = z.union([
  z.string().min(1),
  z.looseObject({ tipo: z.string().min(1) }),
]);

const esquemaPieza = z.strictObject({
  texto: z.string().min(1),
  etiqueta: z.string().min(1),
  resaltar: z.boolean().optional(),
});

export const esquemaPregunta = z.strictObject({
  $schema: z.string().optional(),
  id: z.string().min(1),
  nivel: z.number().int().min(1),
  enunciado: z.string().min(1),
  subtitulo: z.string().optional(),
  opciones: z.array(z.string().min(1)).length(4),
  correcta: z.string().min(1),
  explicacion: z.string().min(1),
  traduccion: z.string().optional(),
  oracion_completa: z.string().optional(),
  mantener_orden: z.boolean().optional(),
  pronunciar: z.string().optional(),
  apoyo: esquemaApoyo.optional(),
  ficha: esquemaFichaDePregunta.optional(),
  resaltar: z.array(z.string()).optional(),
  flecha: z.tuple([z.string(), z.string()]).optional(),
  estructura: z.array(esquemaPieza).optional(),
});

const esquemaFichaTabla = z.strictObject({
  tipo: z.literal('tabla'),
  titulo: z.string().min(1),
  columnas: z.array(z.strictObject({ id: z.string(), texto: z.string() })).min(1),
  filas: z
    .array(
      z.strictObject({
        id: z.string(),
        texto: z.string(),
        celdas: z.record(z.string(), z.string()),
      }),
    )
    .min(1),
  nota: z.string().optional(),
});

const esquemaFichaEscala = z.strictObject({
  tipo: z.literal('escala'),
  titulo: z.string().min(1),
  desde: z.string(),
  hasta: z.string(),
  elementos: z
    .array(z.strictObject({ id: z.string(), original: z.string(), traduccion: z.string() }))
    .min(2),
  nota: z.string().optional(),
});

const esquemaFichaRegla = z.strictObject({
  tipo: z.literal('regla'),
  titulo: z.string().min(1),
  puntos: z
    .array(
      // Un punto puede traer datos extra que solo entiende una extensión (p. ej. rangos de minutos).
      z.looseObject({
        id: z.string(),
        texto: z.string(),
        ejemplos: z.array(ejemplo).optional(),
      }),
    )
    .min(1),
  nota: z.string().optional(),
});

/** Fichas genéricas del motor. Las fichas de extensiones (`tipo` propio) no pasan por aquí. */
export const esquemaFicha = z.discriminatedUnion('tipo', [
  esquemaFichaTabla,
  esquemaFichaEscala,
  esquemaFichaRegla,
]);

export const TIPOS_FICHA_DEL_MOTOR = ['tabla', 'escala', 'regla'] as const;

export const esquemaTraducciones = z.strictObject({
  $schema: z.string().optional(),
  enunciados_fijos: z.record(z.string(), z.string()).default({}),
  patrones_enunciado: z
    .array(z.strictObject({ original: z.string(), traduccion: z.string() }))
    .default([]),
});

// ---------- Configuración del temario ----------

const porNivel = <T extends z.ZodType>(valor: T) => z.record(z.string(), valor);

export const esquemaJuego = z
  .strictObject({
    premios: z.array(z.number().positive()).min(1),
    preguntasSeguras: z.array(z.number().int().positive()),
    nivelPorPregunta: z.array(z.number().int().min(1)).min(1),
    segundosPorNivel: porNivel(z.number().positive()),
    segundosAlerta: z.number().min(0),
    minimoPreguntasPartida: z.number().int().min(1),
    maximoBasePorTema: z.number().int().min(1),
    comodines: z.strictObject({
      cincuentaCincuenta: z.boolean(),
      publico: z.boolean(),
      cambiar: z.boolean(),
    }),
    rangosPublico: porNivel(z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)])),
    duracionesMs: z.strictObject({
      /** Lo que suena el archivo de suspenso: la opción elegida parpadea todo ese tiempo. */
      suspensoSonando: z.number().min(0),
      /** Silencio final del suspenso: la opción queda fija en ámbar hasta la revelación. */
      suspensoSilencio: z.number().min(0),
      antesDeResultado: z.number().min(0),
      barrasPublico: z.number().min(0),
      flechaTabla: z.number().min(0),
      aviso: z.number().min(0),
    }),
  })
  .superRefine((juego, ctx) => {
    if (juego.premios.length !== juego.nivelPorPregunta.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['nivelPorPregunta'],
        message: `premios (${juego.premios.length}) y nivelPorPregunta (${juego.nivelPorPregunta.length}) deben tener el mismo largo`,
      });
    }
    for (const nivel of new Set(juego.nivelPorPregunta)) {
      for (const campo of ['segundosPorNivel', 'rangosPublico'] as const) {
        if (!(String(nivel) in juego[campo])) {
          ctx.addIssue({ code: 'custom', path: [campo], message: `falta el nivel ${nivel}` });
        }
      }
    }
    for (const [nivel, [minimo, maximo]] of Object.entries(juego.rangosPublico)) {
      if (minimo > maximo) {
        ctx.addIssue({
          code: 'custom',
          path: ['rangosPublico', nivel],
          message: 'el mínimo supera al máximo',
        });
      }
    }
    for (const n of juego.preguntasSeguras) {
      if (n > juego.premios.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['preguntasSeguras'],
          message: `la pregunta segura ${n} no existe`,
        });
      }
    }
  });

/** Una forma de filtrar los temas en Inicio y Repaso (p. ej. el nivel del idioma). */
const esquemaDimensionFiltro = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  etiqueta: z.string().min(1),
  /** En el orden en que se muestran. */
  valores: z.array(z.string().min(1)).min(1),
});

const esquemaMoneda = z.strictObject({
  simbolo: z.string(),
  separadorMiles: z.string(),
  simboloAntes: z.boolean(),
});

export const esquemaConfiguracion = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/),
  titulo: z.string().min(1),
  descripcion: z.string(),
  idiomaContenido: z.string().optional(),
  repositorio: z.string().optional(),
  reglasInicio: z.array(z.string()).min(1),
  juego: esquemaJuego,
  moneda: esquemaMoneda,
  marquesina: z.array(z.string()).min(1),
  /** Colores del confeti de la victoria; sin ellos se usan los colores del tema visual. */
  confeti: z.array(z.string()).optional(),
  /** Dimensiones por las que se pueden filtrar los temas; sin ellas no se muestra ningún filtro. */
  filtrosTemas: z.array(esquemaDimensionFiltro).optional(),
  /** Reemplazos de los sonidos, con rutas relativas a la raíz del sitio (por defecto `recursos/sonidos/`). */
  sonidos: z.partialRecord(z.enum(NOMBRES_SONIDO), z.string()).optional(),
  textos: z.record(z.string(), z.unknown()).optional(),
});

// ---------- Tipos ----------

export type Tema = z.infer<typeof esquemaTema>;
export type Pregunta = z.infer<typeof esquemaPregunta> & { tema: string };
export type Ficha = z.infer<typeof esquemaFicha>;
export type Traducciones = z.infer<typeof esquemaTraducciones>;
export type ConfiguracionJuego = z.infer<typeof esquemaJuego>;
export type Moneda = z.infer<typeof esquemaMoneda>;
export type DimensionFiltro = z.infer<typeof esquemaDimensionFiltro>;

export interface PropsVisual {
  pregunta: Pregunta;
  momento: 'pregunta' | 'resultado';
  resaltar?: string[];
  flecha?: [string, string];
}
export type ComponenteVisual = Component<PropsVisual>;

export interface GeneradorPreguntas {
  /** Carpeta de tema de donde lee los datos. */
  tema: string;
  /** Archivo de datos dentro de esa carpeta, p. ej. `sustantivos.json`. */
  archivoDatos: string;
  generar(datos: unknown, aleatorio: () => number): Omit<Pregunta, 'tema'>[];
}

export interface ConfiguracionTemario extends z.infer<typeof esquemaConfiguracion> {
  emblema?: Component;
  extensiones?: {
    apoyos?: Record<string, ComponenteVisual>;
    fichas?: Record<string, ComponenteVisual>;
    generadores?: GeneradorPreguntas[];
    /** Ícono del botón y de la pantalla de pausa (SVG con trazo `currentColor`, tamaño `1em`). */
    iconoPausa?: Component;
    /** Comprobaciones extra que corre `npm run validar`. */
    validadores?: Validador[];
  };
}
