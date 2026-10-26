<script lang="ts" module>
  export interface Rectangulo {
    x: number;
    y: number;
    ancho: number;
    alto: number;
  }
  export interface TrazoFlecha {
    ancho: number;
    alto: number;
    origen: Rectangulo;
    destino: Rectangulo;
  }
</script>

<script lang="ts">
  let { trazo, duracionMs }: { trazo: TrazoFlecha; duracionMs: number } = $props();

  const LARGO_PUNTA = 9;

  const centro = (r: Rectangulo) => ({ x: r.x + r.ancho / 2, y: r.y + r.alto / 2 });

  /** Punto donde la recta que sale del centro de `r` hacia `hacia` cruza el borde del rectángulo. */
  function bordeHacia(r: Rectangulo, hacia: { x: number; y: number }) {
    const c = centro(r);
    const dx = hacia.x - c.x;
    const dy = hacia.y - c.y;
    const escala = Math.min(
      dx === 0 ? Infinity : r.ancho / 2 / Math.abs(dx),
      dy === 0 ? Infinity : r.alto / 2 / Math.abs(dy),
    );
    return { x: c.x + dx * escala, y: c.y + dy * escala };
  }

  // Margen respecto al borde de la celda para que la flecha no pase sobre el texto centrado.
  const MARGEN = 14;

  /** Puntos de salida y llegada. En la misma columna o fila la flecha corre por el borde de la celda. */
  function anclas() {
    const { origen, destino } = trazo;
    const co = centro(origen);
    const cd = centro(destino);
    const mismaColumna = Math.abs(co.x - cd.x) < Math.min(origen.ancho, destino.ancho) / 2;
    const mismaFila = Math.abs(co.y - cd.y) < Math.min(origen.alto, destino.alto) / 2;
    if (mismaColumna && !mismaFila) {
      const x = Math.min(origen.x, destino.x) + MARGEN;
      const baja = cd.y > co.y;
      return {
        inicio: { x, y: baja ? origen.y + origen.alto : origen.y },
        fin: { x, y: baja ? destino.y : destino.y + destino.alto },
      };
    }
    if (mismaFila && !mismaColumna) {
      const y = Math.min(origen.y, destino.y) + MARGEN;
      const derecha = cd.x > co.x;
      return {
        inicio: { x: derecha ? origen.x + origen.ancho : origen.x, y },
        fin: { x: derecha ? destino.x : destino.x + destino.ancho, y },
      };
    }
    return { inicio: bordeHacia(origen, cd), fin: bordeHacia(destino, co) };
  }

  const geometria = $derived.by(() => {
    const { inicio, fin } = anclas();
    const dx = fin.x - inicio.x;
    const dy = fin.y - inicio.y;
    const largo = Math.hypot(dx, dy);
    if (largo < 6) return null;
    const angulo = Math.atan2(dy, dx);
    const punta = (desvio: number) => ({
      x: fin.x - LARGO_PUNTA * Math.cos(angulo + desvio),
      y: fin.y - LARGO_PUNTA * Math.sin(angulo + desvio),
    });
    const a = punta(0.45);
    const b = punta(-0.45);
    // La punta va al final del trazo, así aparece cuando la línea llega.
    return {
      d: `M ${inicio.x} ${inicio.y} L ${fin.x} ${fin.y} M ${a.x} ${a.y} L ${fin.x} ${fin.y} L ${b.x} ${b.y}`,
      total: largo + 2 * LARGO_PUNTA,
    };
  });
</script>

<!-- Decoración: el único elemento en posición absoluta permitido dentro de una ficha. -->
{#if geometria}
  <svg
    class="flecha"
    width={trazo.ancho}
    height={trazo.alto}
    viewBox="0 0 {trazo.ancho} {trazo.alto}"
    aria-hidden="true"
  >
    <path d={geometria.d} style:--total={geometria.total} style:--duracion="{duracionMs}ms" />
  </svg>
{/if}

<style>
  .flecha {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    overflow: visible;
  }
  path {
    fill: none;
    stroke: var(--seleccion);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: var(--total);
    animation: trazar var(--duracion) ease-out both;
  }
  @keyframes trazar {
    from {
      stroke-dashoffset: var(--total);
    }
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
