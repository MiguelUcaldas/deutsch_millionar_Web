import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { banco, fuentes } from './ayudas';

const legacy = (archivo: string) =>
  JSON.parse(
    readFileSync(path.resolve(import.meta.dirname, '../../legacy-datos', archivo), 'utf8'),
  );

const preguntasOriginales: Record<string, unknown>[] = legacy('preguntas.json').preguntas;
const propias = banco.preguntas.filter((p) => p.tema !== 'der_die_das');

describe('migración desde la versión Python', () => {
  it('conserva los conteos: 120 + 70 = 190, 11 temas, 9 fichas, 8 verbos', () => {
    expect(propias).toHaveLength(120);
    expect(banco.preguntas).toHaveLength(190);
    expect(banco.temas).toHaveLength(11);
    expect(Object.keys(banco.fichas)).toHaveLength(9);
    expect(legacy('verbos.json').verbos).toHaveLength(8);
    expect(banco.avisos).toEqual([]);
  });

  it('no alteró ningún texto de las 120 preguntas', () => {
    for (const original of preguntasOriginales) {
      const migrada = banco.preguntas.find((p) => p.id === original.id);
      expect(migrada, String(original.id)).toBeDefined();
      for (const campo of [
        'nivel',
        'enunciado',
        'opciones',
        'correcta',
        'explicacion',
        'traduccion',
        'oracion_completa',
        'resaltar',
        'flecha',
        'estructura',
        'mantener_orden',
      ]) {
        expect((migrada as Record<string, unknown>)[campo], `${original.id}.${campo}`).toEqual(
          original[campo],
        );
      }
      expect(migrada!.tema).toBe(original.tema);
    }
  });

  it('convierte mostrar_reloj en apoyo y los campos de conjugación en una ficha', () => {
    for (const original of preguntasOriginales) {
      const migrada = banco.preguntas.find((p) => p.id === original.id)!;
      if (original.mostrar_reloj) {
        expect(migrada.apoyo).toEqual({ tipo: 'reloj', hora: original.mostrar_reloj });
      } else {
        expect(migrada.apoyo).toBeUndefined();
      }
      if (original.verbo) {
        expect(migrada.ficha).toEqual({
          tipo: 'conjugacion',
          verbo: original.verbo,
          persona: original.persona,
          tiempo: original.tiempo,
        });
      } else {
        expect(migrada.ficha).toEqual(original.ficha);
      }
    }
  });

  it('conserva las fichas, los temas y las traducciones', () => {
    const explicaciones = legacy('explicaciones.json');
    expect(Object.keys(banco.fichas).sort()).toEqual(Object.keys(explicaciones.fichas).sort());
    expect(banco.traducciones.enunciados_fijos).toEqual(explicaciones.enunciados_fijos);
    expect(banco.traducciones.patrones_enunciado).toHaveLength(
      explicaciones.patrones_enunciado.length,
    );

    const temas = legacy('temas.json').temas;
    expect(banco.temas.map((t) => t.id)).toEqual(Object.keys(temas));
    for (const tema of banco.temas) {
      const original = temas[tema.id];
      expect(tema.titulo).toBe(original.titulo);
      expect(tema.nombre_corto).toBe(original.nombre_corto);
      expect(tema.que_es).toBe(original.que_es);
      expect(tema.ejemplos).toHaveLength(original.ejemplos.length);
    }
  });

  it('mueve sustantivos y verbos sin cambios', () => {
    expect(fuentes.temas['der_die_das']!.datos['sustantivos.json']).toEqual(
      legacy('sustantivos_articulos.json'),
    );
    expect(fuentes.temas['conjugacion']!.datos['verbos.json']).toEqual(legacy('verbos.json'));
  });

  it('el orden de los temas es el de la versión de escritorio', () => {
    expect(banco.temas.map((t) => t.id)).toEqual([
      'articulos',
      'nominativo',
      'acusativo',
      'der_die_das',
      'numeros',
      'hora',
      'preposiciones_temporales',
      'verbos_separables',
      'conjugacion',
      'adverbios_frecuencia',
      'conectores',
    ]);
  });
});
