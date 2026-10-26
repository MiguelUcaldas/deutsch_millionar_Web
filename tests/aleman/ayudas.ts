import { armarBanco, fuentesDesdeModulos } from '@motor/contenido/cargar';
import { crearRegistro } from '@motor/contenido/registro';
import { crearAleatorio } from '@motor/juego/aleatorio';
import type { Contexto } from '@motor/juego/maquina';
import configuracionAleman from '../../temarios/aleman/temario.config';

// Estas pruebas usan siempre el temario alemán, sin importar la variable TEMARIO.
export const modulos = import.meta.glob(
  [
    '../../temarios/aleman/contenido/temas/*/*.json',
    '../../temarios/aleman/contenido/fichas/*.json',
    '../../temarios/aleman/contenido/traducciones.json',
  ],
  { eager: true, import: 'default' },
);

export const configuracion = configuracionAleman;
export const fuentes = fuentesDesdeModulos(modulos);
export const registro = crearRegistro(configuracionAleman.extensiones);
export const banco = armarBanco(fuentes, configuracionAleman.juego, registro, crearAleatorio(1));

export function crearContexto(semilla = 1, cambios: Partial<Contexto> = {}): Contexto {
  return {
    juego: configuracionAleman.juego,
    banco: banco.preguntas,
    aleatorio: crearAleatorio(semilla),
    ...cambios,
  };
}

export const cantidadDisponible = (temas: string[]) =>
  banco.preguntas.filter((p) => temas.includes(p.tema)).length;
