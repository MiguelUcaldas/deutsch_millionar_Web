import { z } from 'zod';

export const esquemaSustantivo = z.object({
  palabra: z.string().min(1),
  articulo: z.enum(['der', 'die', 'das']),
  nivel: z.number().int().min(1).max(5),
  plural: z.string().optional(),
  traduccion: z.string().optional(),
  genero_es: z.string().optional(),
});

export type Sustantivo = z.infer<typeof esquemaSustantivo>;

const GENEROS_ES_VALIDOS = ['masculino', 'femenino'];

export interface LecturaSustantivos {
  validos: Sustantivo[];
  /** Entradas omitidas o corregidas, con el motivo. */
  avisos: string[];
}

/** Lee `sustantivos.json` con las mismas reglas tolerantes de la versión de escritorio. */
export function leerSustantivos(datos: unknown): LecturaSustantivos {
  const crudos = (datos as { sustantivos?: unknown[] } | null)?.sustantivos ?? [];
  const validos: Sustantivo[] = [];
  const avisos: string[] = [];
  const vistas = new Set<string>();

  crudos.forEach((crudo, indice) => {
    const posicion = indice + 1;
    const lectura = esquemaSustantivo.safeParse(crudo);
    if (!lectura.success) {
      const campos = lectura.error.issues.map((i) => i.path.join('.') || '(raíz)').join(', ');
      avisos.push(`Sustantivo #${posicion} omitido: campos inválidos (${campos})`);
      return;
    }
    const sustantivo = lectura.data;
    if (sustantivo.palabra[0] !== sustantivo.palabra[0]!.toUpperCase()) {
      avisos.push(`Sustantivo #${posicion} (${sustantivo.palabra}): debería empezar con mayúscula`);
    }
    if (vistas.has(sustantivo.palabra)) {
      avisos.push(
        `Sustantivo #${posicion} (${sustantivo.palabra}): repetido, se conserva el primero`,
      );
      return;
    }
    vistas.add(sustantivo.palabra);
    if (sustantivo.genero_es && !GENEROS_ES_VALIDOS.includes(sustantivo.genero_es)) {
      avisos.push(
        `Sustantivo #${posicion} (${sustantivo.palabra}): genero_es «${sustantivo.genero_es}» no es válido, se ignora`,
      );
      validos.push({ ...sustantivo, genero_es: undefined });
      return;
    }
    validos.push(sustantivo);
  });

  return { validos, avisos };
}
