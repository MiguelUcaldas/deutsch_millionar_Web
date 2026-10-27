// Se carga dentro de Vite (ver validar-contenido.ts): aquí sí existen los alias y import.meta.glob.
import configuracion from '@temario';
import type { ConfiguracionTemario } from '@motor/contenido/esquemas';
import { fuentesDelTemario } from '@motor/contenido/desdeTemario';
import { validarContenido } from '@motor/contenido/validar';

export const niveles = configuracion.juego.nivelPorPregunta;

export function validarTemarioActual() {
  return validarContenido(fuentesDelTemario(), configuracion);
}

/** Lo que necesita validar-sonidos.ts, que corre fuera de Vite. */
export const sonidosDelTemario = {
  reemplazos: (configuracion as ConfiguracionTemario).sonidos,
  duracionesMs: configuracion.juego.duracionesMs,
};
