import { describe, expect, it } from 'vitest';
import type { FuentesContenido } from '@motor/contenido/cargar';
import { validarContenido } from '@motor/contenido/validar';
import { configuracion, fuentes } from './ayudas';

/** Copia profunda para poder estropear los datos sin afectar a otras pruebas. */
const copiar = (): FuentesContenido => structuredClone(fuentes);

type Cruda = Record<string, unknown>;
const preguntasDe = (f: FuentesContenido, tema: string) => f.temas[tema]!.preguntas as Cruda[];

describe('validación del temario alemán', () => {
  it('el contenido migrado no tiene errores', () => {
    const informe = validarContenido(fuentes, configuracion);
    expect(informe.errores).toEqual([]);
    expect(informe.totalPreguntas).toBe(190);
  });

  it('reporta el conteo por tema y nivel', () => {
    const informe = validarContenido(fuentes, configuracion);
    expect(informe.conteo['der_die_das']).toEqual({ 1: 14, 2: 14, 3: 14, 4: 14, 5: 14 });
    expect(Object.keys(informe.conteo)).toHaveLength(11);
  });

  it('detecta una conjugación que no coincide con verbos.json', () => {
    const f = copiar();
    preguntasDe(f, 'conjugacion')[0]!.correcta = 'lernst';
    const errores = validarContenido(f, configuracion).errores;
    expect(errores.some((e) => e.includes('CON-001'))).toBe(true);
  });

  it('detecta un verbo inexistente en la ficha de conjugación', () => {
    const f = copiar();
    const pregunta = preguntasDe(f, 'conjugacion')[0]!;
    pregunta.ficha = { ...(pregunta.ficha as Cruda), verbo: 'inventar' };
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('inventar');
  });

  it('detecta una hora con formato inválido', () => {
    const f = copiar();
    preguntasDe(f, 'hora')[0]!.apoyo = { tipo: 'reloj', hora: '8:5' };
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('HH:MM');
  });

  it('detecta un resaltar que no existe en la ficha', () => {
    const f = copiar();
    preguntasDe(f, 'acusativo')[0]!.resaltar = ['no_existe.masculino'];
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('resaltar[0]');
  });

  it('detecta una flecha que no existe en la ficha', () => {
    const f = copiar();
    const pregunta = preguntasDe(f, 'acusativo').find((p) => p.flecha)!;
    pregunta.flecha = [(pregunta.flecha as string[])[0], 'no_existe'];
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('flecha[1]');
  });

  it('detecta una cantidad de huecos distinta a las partes de la respuesta', () => {
    const f = copiar();
    const pregunta = preguntasDe(f, 'verbos_separables').find(
      (p) => String(p.enunciado).split('___').length === 3,
    )!;
    pregunta.correcta = 'solo una parte';
    pregunta.opciones = [pregunta.correcta, 'b', 'c', 'd'];
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('partes');
  });

  it('detecta una estructura que no reconstruye la oración', () => {
    const f = copiar();
    const pregunta = preguntasDe(f, 'nominativo').find((p) => p.estructura)!;
    pregunta.estructura = [{ texto: 'palabras que no están', etiqueta: 'Sujeto' }];
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('estructura');
  });

  it('detecta un enunciado sin traducción conocida', () => {
    const f = copiar();
    preguntasDe(f, 'hora')[0]!.enunciado = 'Ein Satz ohne Übersetzung?';
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain(
      'no tiene traducción conocida',
    );
  });

  it('detecta un id repetido, un prefijo equivocado y una ficha inexistente', () => {
    const f = copiar();
    const lista = preguntasDe(f, 'articulos');
    lista[1]!.id = lista[0]!.id as string;
    lista[2]!.id = 'XXX-001';
    lista[3]!.ficha = 'ficha_fantasma';
    const texto = validarContenido(f, configuracion).errores.join('\n');
    expect(texto).toContain('id repetido');
    expect(texto).toContain('el id debe empezar por');
    expect(texto).toContain('ficha_fantasma');
  });

  it('detecta un sustantivo con artículo inválido', () => {
    const f = copiar();
    const datos = f.temas['der_die_das']!.datos['sustantivos.json'] as { sustantivos: Cruda[] };
    datos.sustantivos[0]!.articulo = 'dem';
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('Sustantivo #1');
  });

  it('detecta una ficha_principal inexistente', () => {
    const f = copiar();
    (f.temas['articulos']!.tema as Cruda).ficha_principal = 'ficha_fantasma';
    expect(validarContenido(f, configuracion).errores.join('\n')).toContain('ficha_principal');
  });
});
