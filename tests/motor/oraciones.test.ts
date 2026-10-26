import { describe, expect, it } from 'vitest';
import { oracionCompleta, reconstruirOracion } from '@motor/juego/oraciones';
import { traducirEnunciado } from '@motor/juego/traducciones';

const insertados = (p: Parameters<typeof reconstruirOracion>[0]) =>
  reconstruirOracion(p)
    .filter((s) => s.insertado)
    .map((s) => s.texto);

describe('reconstruir oración', () => {
  it('un hueco', () => {
    const p = { enunciado: 'Yo veo ___ perro.', correcta: 'al' };
    expect(oracionCompleta(p)).toBe('Yo veo al perro.');
    expect(insertados(p)).toEqual(['al']);
  });

  it('dos huecos', () => {
    const p = { enunciado: 'Yo ___ cada día ___.', correcta: 'salgo / temprano' };
    expect(oracionCompleta(p)).toBe('Yo salgo cada día temprano.');
    expect(insertados(p)).toEqual(['salgo', 'temprano']);
  });

  it('«—» significa que no se inserta nada y no deja espacios de más', () => {
    const p = { enunciado: 'Yo ___ cada día ___.', correcta: 'salgo / —' };
    expect(oracionCompleta(p)).toBe('Yo salgo cada día.');
    expect(insertados(p)).toEqual(['salgo']);
  });

  it('la oración completa propia tiene prioridad', () => {
    const p = {
      enunciado: '¿Cómo se dice «Estoy cansado porque...»?',
      correcta: 'trabajé toda la noche.',
      oracion_completa: 'Estoy cansado porque trabajé toda la noche.',
    };
    expect(oracionCompleta(p)).toBe('Estoy cansado porque trabajé toda la noche.');
    expect(insertados(p)).toEqual([]);
  });

  it('sin hueco la oración es la respuesta', () => {
    const p = { enunciado: '¿Qué significa «nie»?', correcta: 'nunca' };
    expect(oracionCompleta(p)).toBe('nunca');
    expect(insertados(p)).toEqual([]);
  });

  it('el relleno al principio de la oración se marca como insertado', () => {
    const p = { enunciado: '___ es la capital.', correcta: 'París' };
    expect(reconstruirOracion(p)).toEqual([
      { texto: 'París', insertado: true },
      { texto: ' es la capital.', insertado: false },
    ]);
  });

  it('los segmentos concatenados siempre dan la oración plana', () => {
    const p = { enunciado: 'A ___ B ___ C?', correcta: 'x / y' };
    expect(
      reconstruirOracion(p)
        .map((s) => s.texto)
        .join(''),
    ).toBe('A x B y C?');
  });
});

describe('traducir enunciado', () => {
  const traducciones = {
    enunciados_fijos: { '¿Qué hora es?': 'What time is it?' },
    patrones_enunciado: [
      { original: '¿Qué significa el número {x}?', traduccion: 'What number is {x}?' },
      { original: '¿Qué significa {x}?', traduccion: 'What does {x} mean?' },
    ],
  };

  it('los fijos tienen prioridad', () => {
    expect(traducirEnunciado('¿Qué hora es?', traducciones)).toBe('What time is it?');
  });

  it('gana el patrón más específico (el primero en el archivo)', () => {
    expect(traducirEnunciado('¿Qué significa el número 7?', traducciones)).toBe(
      'What number is 7?',
    );
  });

  it('cae al patrón general', () => {
    expect(traducirEnunciado('¿Qué significa «nie»?', traducciones)).toBe('What does «nie» mean?');
  });

  it('sin coincidencia devuelve null', () => {
    expect(traducirEnunciado('Algo sin registrar', traducciones)).toBeNull();
  });

  it('los caracteres especiales del patrón no rompen la expresión', () => {
    const t = {
      enunciados_fijos: {},
      patrones_enunciado: [{ original: '(¿{x}?) [fin]', traduccion: '{x}' }],
    };
    expect(traducirEnunciado('(¿hola?) [fin]', t)).toBe('hola');
  });
});
