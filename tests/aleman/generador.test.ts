import { describe, expect, it } from 'vitest';
import { crearAleatorio } from '@motor/juego/aleatorio';
import generoTerminaciones from '../../temarios/aleman/contenido/fichas/genero_terminaciones.json';
import {
  generadorDerDieDas,
  generarPregunta,
  puntoDeGenero,
} from '../../temarios/aleman/extensiones/generadorDerDieDas';
import { leerSustantivos, type Sustantivo } from '../../temarios/aleman/extensiones/sustantivos';
import { banco, fuentes } from './ayudas';

const puntos = generoTerminaciones.puntos;
const sustantivo = (extra: Partial<Sustantivo>): Sustantivo => ({
  palabra: 'Tisch',
  articulo: 'der',
  nivel: 1,
  ...extra,
});

describe('punto de la ficha según la terminación', () => {
  it('Mädchen usa -chen', () => {
    const pregunta = generarPregunta(
      sustantivo({
        palabra: 'Mädchen',
        articulo: 'das',
        nivel: 4,
        traduccion: 'la niña',
        genero_es: 'femenino',
      }),
      puntos,
    );
    expect(pregunta.resaltar).toEqual(['neutro_chen']);
  });

  it('Wohnung usa los sufijos femeninos', () => {
    expect(puntoDeGenero('Wohnung', puntos)).toBe('femenino_sufijos');
  });

  it('Tisch no tiene regla', () => {
    expect(puntoDeGenero('Tisch', puntos)).toBe('sin_regla');
  });
});

describe('nota de contraste', () => {
  it('el neutro siempre la lleva', () => {
    const pregunta = generarPregunta(
      sustantivo({
        palabra: 'Mädchen',
        articulo: 'das',
        traduccion: 'la niña',
        genero_es: 'femenino',
      }),
      puntos,
    );
    expect(pregunta.explicacion).toContain('en alemán es neutro');
  });

  it('un género distinto al español la lleva', () => {
    const pregunta = generarPregunta(
      sustantivo({
        palabra: 'Sonne',
        articulo: 'die',
        nivel: 5,
        traduccion: 'el sol',
        genero_es: 'masculino',
      }),
      puntos,
    );
    expect(pregunta.explicacion).toContain('en español es masculino');
  });

  it('un género coincidente no la lleva', () => {
    const pregunta = generarPregunta(
      sustantivo({ traduccion: 'el árbol', genero_es: 'masculino' }),
      puntos,
    );
    expect(pregunta.explicacion).not.toContain('en español es');
    expect(pregunta.explicacion).not.toContain('en alemán es neutro');
  });
});

describe('preguntas der/die/das generadas', () => {
  it('tienen las opciones en orden fijo y el subtítulo del artículo', () => {
    const pregunta = generarPregunta(sustantivo({ plural: 'Tische', traduccion: 'mesa' }), puntos);
    expect(pregunta.opciones).toEqual(['der', 'die', 'das', 'den']);
    expect(pregunta.mantener_orden).toBe(true);
    expect(pregunta.subtitulo).toBe('Welcher Artikel ist richtig?');
    expect(pregunta.enunciado).toBe('___ Tisch');
    expect(pregunta.traduccion).toBe('der Tisch → die Tische · mesa');
    expect(pregunta.ficha).toBe('genero_terminaciones');
  });

  it('el plural va en un apoyo aparte, con el artículo «die», y solo si el sustantivo lo tiene', () => {
    const con = generarPregunta(sustantivo({ plural: 'Tische' }), puntos);
    expect(con.apoyo).toEqual({ tipo: 'plural', singular: 'der Tisch', plural: 'die Tische' });
    const sin = generarPregunta(sustantivo({ plural: undefined }), puntos);
    expect(sin.apoyo).toBeUndefined();
  });

  it('todas las preguntas generadas con plural lo muestran con «die»', () => {
    const conPlural = banco.preguntas.filter((p) => p.tema === 'der_die_das' && p.apoyo);
    expect(conPlural.length).toBeGreaterThan(0);
    for (const pregunta of conPlural) {
      expect(pregunta.apoyo).toMatchObject({ tipo: 'plural' });
      expect(String(pregunta.apoyo!.plural)).toMatch(/^die \S+$/);
    }
  });

  it('el generador produce las 70 preguntas DDD-Palabra, todas válidas', () => {
    const generadas = banco.preguntas.filter((p) => p.tema === 'der_die_das');
    expect(generadas).toHaveLength(70);
    expect(generadas.every((p) => p.id.startsWith('DDD-') && p.mantener_orden)).toBe(true);
    const sustantivos = leerSustantivos(fuentes.temas['der_die_das']!.datos['sustantivos.json']);
    expect(sustantivos.avisos).toEqual([]);
    for (const s of sustantivos.validos) {
      expect(generadas.find((p) => p.id === `DDD-${s.palabra}`)?.correcta).toBe(s.articulo);
    }
  });

  it('cada nivel tiene 14 sustantivos', () => {
    for (let nivel = 1; nivel <= 5; nivel++) {
      const cantidad = banco.preguntas.filter(
        (p) => p.tema === 'der_die_das' && p.nivel === nivel,
      ).length;
      expect(cantidad).toBe(14);
    }
  });

  it('el generador no depende del aleatorio', () => {
    const datos = fuentes.temas['der_die_das']!.datos['sustantivos.json'];
    expect(generadorDerDieDas.generar(datos, crearAleatorio(1))).toEqual(
      generadorDerDieDas.generar(datos, crearAleatorio(99)),
    );
  });
});

describe('lectura tolerante de sustantivos', () => {
  const leer = (...sustantivos: unknown[]) => leerSustantivos({ sustantivos });

  it('omite artículo, nivel o palabra inválidos', () => {
    const { validos, avisos } = leer(
      { palabra: 'Hund', articulo: 'der', nivel: 1 },
      { palabra: 'Katze', articulo: 'dem', nivel: 1 },
      { palabra: 'Haus', articulo: 'das', nivel: 9 },
      { palabra: '', articulo: 'der', nivel: 1 },
    );
    expect(validos.map((s) => s.palabra)).toEqual(['Hund']);
    expect(avisos).toHaveLength(3);
  });

  it('conserva la primera aparición de una palabra repetida', () => {
    const { validos, avisos } = leer(
      { palabra: 'Hund', articulo: 'der', nivel: 1 },
      { palabra: 'Hund', articulo: 'der', nivel: 2 },
    );
    expect(validos).toHaveLength(1);
    expect(validos[0]!.nivel).toBe(1);
    expect(avisos[0]).toContain('repetido');
  });

  it('ignora un genero_es inválido y avisa si empieza en minúscula', () => {
    const { validos, avisos } = leer({
      palabra: 'hund',
      articulo: 'der',
      nivel: 1,
      genero_es: 'neutro',
    });
    expect(validos[0]!.genero_es).toBeUndefined();
    expect(avisos).toHaveLength(2);
  });
});
