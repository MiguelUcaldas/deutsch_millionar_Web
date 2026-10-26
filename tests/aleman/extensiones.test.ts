import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { Pregunta } from '@motor/contenido/esquemas';
import ApoyoReloj from '../../temarios/aleman/extensiones/ApoyoReloj.svelte';
import FichaConjugacion from '../../temarios/aleman/extensiones/FichaConjugacion.svelte';
import Emblema from '../../temarios/aleman/Emblema.svelte';
import { banco } from './ayudas';

const pregunta = (id: string): Pregunta => banco.preguntas.find((p) => p.id === id)!;
const html = (componente: never, props: object) =>
  render(componente as never, { props } as never).body;

describe('ApoyoReloj', () => {
  const horaFormal = pregunta('HOR-001');

  it('dibuja las manecillas de la hora de la pregunta', () => {
    const salida = html(ApoyoReloj as never, { pregunta: horaFormal, momento: 'pregunta' });
    expect(salida).toContain('Reloj que marca las 08:00');
    expect(salida).toContain('manecilla hora');
    expect(salida).not.toContain('franja');
  });

  it('en el resultado dibuja la franja de minutos de la regla resaltada', () => {
    const informal = banco.preguntas.find(
      (p) =>
        p.apoyo?.tipo === 'reloj' && p.resaltar?.some((id) => ['nach', 'vor', 'halb'].includes(id)),
    );
    expect(informal, 'debe haber una pregunta de hora informal').toBeDefined();
    const salida = html(ApoyoReloj as never, { pregunta: informal, momento: 'resultado' });
    expect(salida).toMatch(/class="franja /);
  });

  it('sin regla con minutos no hay franja ni en el resultado', () => {
    const salida = html(ApoyoReloj as never, { pregunta: horaFormal, momento: 'resultado' });
    expect(salida).not.toMatch(/class="franja /);
  });
});

describe('FichaConjugacion', () => {
  const conjugacion = pregunta('CON-001');

  it('muestra las siete personas, resalta la de la pregunta y parte raíz y terminación', () => {
    const salida = html(FichaConjugacion as never, { pregunta: conjugacion, momento: 'resultado' });
    expect(salida).toContain('lernen');
    expect(salida.match(/<tr/g)).toHaveLength(7);
    expect(salida).toContain('▶');
    expect(salida).toContain('<strong class="terminacion');
    expect(salida).toContain('lern');
    expect(salida).toContain('ustedes (informal)');
    expect(salida).toContain('lang="de"');
  });

  it('marca con ● las formas irregulares', () => {
    const irregular = banco.preguntas.find(
      (p) => typeof p.ficha === 'object' && (p.ficha as { verbo?: string }).verbo === 'sein',
    );
    expect(irregular, 'debe haber una pregunta con sein').toBeDefined();
    const salida = html(FichaConjugacion as never, { pregunta: irregular, momento: 'resultado' });
    expect(salida).toContain('●');
  });

  it('todas las preguntas de conjugación se pueden dibujar', () => {
    const todas = banco.preguntas.filter((p) => p.tema === 'conjugacion');
    expect(todas).toHaveLength(12);
    for (const p of todas) {
      expect(html(FichaConjugacion as never, { pregunta: p, momento: 'resultado' })).toContain(
        '<table',
      );
    }
  });
});

describe('Emblema', () => {
  it('es la bandera de Alemania con sus tres franjas', () => {
    const salida = render(Emblema as never, {} as never).body;
    expect(salida).toContain('#000000');
    expect(salida).toContain('#DD0000');
    expect(salida).toContain('#FFCE00');
  });
});
