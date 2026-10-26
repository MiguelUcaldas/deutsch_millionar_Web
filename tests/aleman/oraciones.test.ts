import { describe, expect, it } from 'vitest';
import { oracionCompleta, reconstruirOracion } from '@motor/juego/oraciones';
import { traducirEnunciado } from '@motor/juego/traducciones';
import { banco } from './ayudas';

const insertados = (p: Parameters<typeof reconstruirOracion>[0]) =>
  reconstruirOracion(p)
    .filter((s) => s.insertado)
    .map((s) => s.texto);

describe('oraciones en alemán', () => {
  it('un hueco', () => {
    const p = { enunciado: 'Ich sehe ___ Hund.', correcta: 'den' };
    expect(oracionCompleta(p)).toBe('Ich sehe den Hund.');
    expect(insertados(p)).toEqual(['den']);
  });

  it('dos huecos', () => {
    const p = { enunciado: 'Ich ___ jeden Morgen um 7 Uhr ___.', correcta: 'stehe / auf' };
    expect(oracionCompleta(p)).toBe('Ich stehe jeden Morgen um 7 Uhr auf.');
    expect(insertados(p)).toEqual(['stehe', 'auf']);
  });

  it('el guion largo es vacío', () => {
    const p = { enunciado: 'Ich ___ jeden Morgen ___.', correcta: 'stehe / —' };
    expect(oracionCompleta(p)).toBe('Ich stehe jeden Morgen.');
    expect(insertados(p)).toEqual(['stehe']);
  });

  it('la oración completa propia tiene prioridad', () => {
    const p = {
      enunciado: 'Wie sagt man richtig: Ich bin müde, weil...?',
      correcta: 'ich die ganze Nacht gearbeitet habe.',
      oracion_completa: 'Ich bin müde, weil ich die ganze Nacht gearbeitet habe.',
    };
    expect(oracionCompleta(p)).toBe('Ich bin müde, weil ich die ganze Nacht gearbeitet habe.');
    expect(insertados(p)).toEqual([]);
  });

  it('sin hueco la oración es la respuesta', () => {
    const p = { enunciado: "Was bedeutet 'nie'?", correcta: 'nunca' };
    expect(oracionCompleta(p)).toBe('nunca');
  });

  it('el artículo suelto de der/die/das se arma delante del sustantivo', () => {
    const p = { enunciado: '___ Tisch', correcta: 'der' };
    expect(oracionCompleta(p)).toBe('der Tisch');
    expect(insertados(p)).toEqual(['der']);
  });
});

describe('traducción de enunciados', () => {
  const t = banco.traducciones;

  it('un enunciado fijo', () => {
    expect(traducirEnunciado('Wie spät ist es?', t)).toBe('¿Qué hora es?');
  });

  it('el patrón específico gana al general', () => {
    expect(traducirEnunciado('Was bedeutet die Zahl 7?', t)).toBe('¿Qué número es 7?');
    expect(traducirEnunciado("Was bedeutet 'nie'?", t)).toBe("¿Qué significa 'nie'?");
  });

  it('sin coincidencia devuelve null', () => {
    expect(traducirEnunciado('Algo que no está registrado', t)).toBeNull();
  });

  it('todos los enunciados sin hueco del banco tienen traducción', () => {
    const sinTraducir = banco.preguntas
      .filter((p) => !p.enunciado.includes('___'))
      .filter((p) => traducirEnunciado(p.enunciado, t) === null)
      .map((p) => p.id);
    expect(sinTraducir).toEqual([]);
  });

  it('todas las preguntas tienen explicación y traducción', () => {
    const incompletas = banco.preguntas
      .filter((p) => !p.explicacion.trim() || !p.traduccion?.trim())
      .map((p) => p.id);
    expect(incompletas).toEqual([]);
  });
});
