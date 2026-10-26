import { z } from 'zod';
import datosVerbos from '../contenido/temas/conjugacion/verbos.json';

export const PERSONAS_ESPERADAS = [
  'ich',
  'du',
  'er_sie_es',
  'wir',
  'ihr',
  'sie_plural',
  'Sie_formal',
] as const;

const esquemaForma = z.object({
  de: z.string(),
  es: z.string(),
  especial: z.boolean().optional(),
});

export const esquemaVerbos = z.object({
  personas: z.array(z.object({ id: z.string(), de: z.string(), es: z.string() })),
  tiempos: z.record(z.string(), z.object({ de: z.string(), es: z.string() })),
  tipos: z.record(z.string(), z.string()),
  verbos: z.array(
    z.object({
      infinitivo: z.string(),
      traduccion: z.string(),
      tipo: z.string(),
      raiz: z.string().optional(),
      nota: z.string().optional(),
      tiempos: z.record(z.string(), z.record(z.string(), esquemaForma)),
    }),
  ),
});

export type DatosVerbos = z.infer<typeof esquemaVerbos>;
export type Verbo = DatosVerbos['verbos'][number];

export const verbos: DatosVerbos = esquemaVerbos.parse(datosVerbos);

export function buscarVerbo(infinitivo: string): Verbo | undefined {
  return verbos.verbos.find((v) => v.infinitivo === infinitivo);
}
