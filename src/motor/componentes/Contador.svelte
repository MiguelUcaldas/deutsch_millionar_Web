<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  let { segundos, alerta }: { segundos: number; alerta: boolean } = $props();
  const { textos } = obtenerJuego();
</script>

<div
  class="contador"
  class:alerta
  role="timer"
  aria-label={textos.segundosRestantes}
  aria-live={alerta ? 'polite' : 'off'}
  aria-atomic="true"
>
  <span class="numero numeros">{segundos}</span>
  <span class="unidad">{textos.segundosUnidad}</span>
</div>

<style>
  .contador {
    min-width: 88px;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    padding: 8px 14px;
    border-radius: var(--radio-m);
    border: 1.5px solid var(--borde);
    background: var(--superficie-2);
  }
  .numero {
    font-size: 34px;
    font-weight: 600;
    line-height: 1;
  }
  .unidad {
    font-size: var(--texto-s);
    color: var(--texto-suave);
  }
  .alerta {
    border-color: var(--incorrecto);
    background: var(--incorrecto-fondo);
  }
  .alerta .numero {
    color: var(--incorrecto-texto);
    animation: parpadeo 1s steps(2, jump-none) infinite;
  }
  @media (max-width: 560px) {
    .numero {
      font-size: 28px;
    }
  }
</style>
