// Revisa que los sonidos del temario existan y que sus tiempos de suspenso coincidan con el archivo.
// Lo llama validar-contenido.ts (npm run validar).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { NOMBRES_SONIDO, rutasDeSonido, type RutasSonido } from '../src/motor/sonidos/rutas.ts';
import { medirSonido } from './medir-sonidos.ts';

const publico = path.resolve(import.meta.dirname, '..', 'public');
/** Diferencia máxima entre lo configurado y lo medido en el archivo. */
const TOLERANCIA_MS = 30;

export interface EntradaSonidos {
  reemplazos?: Partial<RutasSonido>;
  duracionesMs: { suspensoSonando: number; suspensoSilencio: number };
}

export async function validarSonidos({ reemplazos, duracionesMs }: EntradaSonidos) {
  const errores: string[] = [];
  const rutas = rutasDeSonido(reemplazos);

  for (const nombre of NOMBRES_SONIDO) {
    const ruta = rutas[nombre];
    if (/^(https?:)?\/\//.test(ruta)) continue;
    const archivo = path.join(publico, ruta);
    if (!existsSync(archivo)) {
      errores.push(`sonidos.${nombre}: no existe public/${ruta}`);
      continue;
    }
    try {
      const medida = await medirSonido(archivo);
      if (nombre !== 'suspenso') continue;
      const comparar = (campo: 'suspensoSonando' | 'suspensoSilencio', medido: number) => {
        const configurado = duracionesMs[campo];
        if (Math.abs(configurado - medido) > TOLERANCIA_MS) {
          errores.push(
            `duracionesMs.${campo} es ${configurado} ms pero ${ruta} mide ${Math.round(medido)} ms (tolerancia ±${TOLERANCIA_MS} ms)`,
          );
        }
      };
      comparar('suspensoSonando', medida.finSonidoMs);
      comparar('suspensoSilencio', medida.silencioFinalMs);
    } catch (error) {
      errores.push(`${ruta}: no se pudo decodificar — ${(error as Error).message}`);
    }
  }
  return errores;
}
