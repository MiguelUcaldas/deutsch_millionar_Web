import { fuentesDesdeModulos, type FuentesContenido } from './cargar';

// El alias @temario apunta a la carpeta elegida al compilar; agregar un tema es crear una carpeta.
const modulos = import.meta.glob(
  [
    '@temario/contenido/temas/*/*.json',
    '@temario/contenido/fichas/*.json',
    '@temario/contenido/traducciones.json',
  ],
  { eager: true, import: 'default' },
);

export function fuentesDelTemario(): FuentesContenido {
  return fuentesDesdeModulos(modulos);
}
