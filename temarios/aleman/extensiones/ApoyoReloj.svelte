<script lang="ts">
  import type { PropsVisual } from '@motor/contenido/esquemas';
  import horaInformal from '../contenido/fichas/hora_informal.json';

  let { pregunta, momento }: PropsVisual = $props();

  const MARCAS = Array.from({ length: 12 }, (_, i) => i);
  const CENTRO = 50;
  const RADIO = 46;

  const hora = $derived(String(pregunta.apoyo?.hora ?? '00:00'));
  const [horas, minutos] = $derived(hora.split(':').map(Number) as [number, number]);

  const punto = (grados: number, largo: number) => {
    const radianes = (grados * Math.PI) / 180;
    return [CENTRO + largo * Math.sin(radianes), CENTRO - largo * Math.cos(radianes)] as const;
  };

  const anguloHora = $derived((((horas % 12) + minutos / 60) / 12) * 360);
  const anguloMinuto = $derived((minutos / 60) * 360);
  const puntaHora = $derived(punto(anguloHora, RADIO * 0.5));
  const puntaMinuto = $derived(punto(anguloMinuto, RADIO * 0.8));

  // La franja de minutos de la regla se muestra solo en el resultado.
  const franja = $derived.by(() => {
    // Solo la regla de hora informal tiene rangos de minutos (la formal reutiliza ids como «en_punto»).
    if (momento !== 'resultado' || pregunta.ficha !== 'hora_informal') return null;
    const regla = horaInformal.puntos.find(
      (p) => pregunta.resaltar?.includes(p.id) && 'minutos' in p,
    ) as { minutos: [number, number] } | undefined;
    if (!regla) return null;
    const [inicio, fin] = regla.minutos;
    const ancho = Math.max((fin - inicio) * 6, 3);
    const desde = punto(inicio * 6, RADIO - 2);
    const hasta = punto(inicio * 6 + ancho, RADIO - 2);
    const arco = ancho > 180 ? 1 : 0;
    return `M ${CENTRO} ${CENTRO} L ${desde[0]} ${desde[1]} A ${RADIO - 2} ${RADIO - 2} 0 ${arco} 1 ${hasta[0]} ${hasta[1]} Z`;
  });
</script>

<svg
  class="reloj"
  class:grande={momento === 'resultado'}
  viewBox="0 0 100 100"
  role="img"
  aria-label={`Reloj que marca las ${hora}`}
>
  <circle class="esfera" cx={CENTRO} cy={CENTRO} r={RADIO} />
  {#if franja}
    <path class="franja" d={franja} />
  {/if}
  {#each MARCAS as marca (marca)}
    {@const desde = punto(marca * 30, RADIO - 5)}
    {@const hasta = punto(marca * 30, RADIO - 1)}
    <line class="marca" x1={desde[0]} y1={desde[1]} x2={hasta[0]} y2={hasta[1]} />
  {/each}
  <line class="manecilla hora" x1={CENTRO} y1={CENTRO} x2={puntaHora[0]} y2={puntaHora[1]} />
  <line class="manecilla minuto" x1={CENTRO} y1={CENTRO} x2={puntaMinuto[0]} y2={puntaMinuto[1]} />
  <circle class="centro" cx={CENTRO} cy={CENTRO} r="2.5" />
</svg>

<style>
  .reloj {
    width: 96px;
    height: 96px;
    flex: none;
  }
  .reloj.grande {
    width: 160px;
    height: 160px;
  }
  .esfera {
    fill: var(--superficie-2);
    stroke: var(--acento);
    stroke-width: 3;
  }
  .franja {
    fill: var(--seleccion-fondo);
    stroke: var(--seleccion);
    stroke-width: 1;
  }
  .marca {
    stroke: var(--texto-suave);
    stroke-width: 1.5;
  }
  .manecilla {
    stroke: var(--texto);
    stroke-linecap: round;
  }
  .manecilla.hora {
    stroke-width: 4;
  }
  .manecilla.minuto {
    stroke-width: 2;
  }
  .centro {
    fill: var(--acento);
  }
</style>
