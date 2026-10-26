// Se carga dentro de Vite (ver validar-contenido.ts): aquí sí existen los alias y import.meta.glob.
import configuracion from '@temario';
import { fuentesDelTemario } from '@motor/contenido/desdeTemario';
import { validarContenido } from '@motor/contenido/validar';

export const niveles = configuracion.juego.nivelPorPregunta;

export function validarTemarioActual() {
  return validarContenido(fuentesDelTemario(), configuracion);
}
