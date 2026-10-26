<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  // Sin colores del temario se usan los del tema visual.
  const colores = obtenerJuego().configuracion.confeti ?? [
    'var(--acento)',
    'var(--correcto)',
    'var(--seleccion)',
    'var(--publico)',
  ];
  const piezas = Array.from({ length: 24 }, (_, i) => ({
    izquierda: i * 4.2 + 2,
    color: colores[i % colores.length],
    retraso: ((i * 0.37) % 3.2).toFixed(2),
    contorno: i % 3 === 0,
  }));
</script>

<div class="confeti" aria-hidden="true">
  {#each piezas as pieza, i (i)}
    <span
      class:contorno={pieza.contorno}
      style:left="{pieza.izquierda}%"
      style:background={pieza.color}
      style:animation-delay="{pieza.retraso}s"
    ></span>
  {/each}
</div>

<style>
  /* Decoración pura: es de lo poco que puede ir en posición absoluta. */
  .confeti {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  span {
    position: absolute;
    top: -12px;
    width: 9px;
    height: 9px;
    animation: caer 3.2s linear infinite;
  }
  .contorno {
    outline: 1px solid var(--borde-fuerte);
  }
</style>
