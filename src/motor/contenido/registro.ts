import type { Component } from 'svelte';
import {
  TIPOS_FICHA_DEL_MOTOR,
  type ComponenteVisual,
  type ConfiguracionTemario,
  type GeneradorPreguntas,
} from './esquemas';

export interface Registro {
  /** Tipos de ficha que existen: los del motor más los del temario. */
  tiposDeFicha: Set<string>;
  /** Componentes de ficha aportados por el temario (las genéricas las dibuja el motor). */
  fichas: Record<string, ComponenteVisual>;
  apoyos: Record<string, ComponenteVisual>;
  generadores: GeneradorPreguntas[];
  iconoPausa?: Component;
}

export function crearRegistro(extensiones: ConfiguracionTemario['extensiones'] = {}): Registro {
  const fichas = extensiones.fichas ?? {};
  return {
    tiposDeFicha: new Set([...TIPOS_FICHA_DEL_MOTOR, ...Object.keys(fichas)]),
    fichas,
    apoyos: extensiones.apoyos ?? {},
    generadores: extensiones.generadores ?? [],
    iconoPausa: extensiones.iconoPausa,
  };
}
