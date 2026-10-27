<script lang="ts">
  import { onMount } from 'svelte';
  import { obtenerJuego } from '../estado/juego.svelte';
  import IconoDePausa from './IconoDePausa.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;

  let continuar: HTMLButtonElement;
  const identificador = `pausa-${Math.random().toString(36).slice(2, 8)}`;

  onMount(() => {
    // Al reanudar, el foco vuelve a donde estaba (el botón de pausa o el siguiente botón).
    const origen = document.activeElement as HTMLElement | null;
    continuar.focus();
    return () => queueMicrotask(() => origen?.focus?.());
  });

  function alTeclear(evento: KeyboardEvent) {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (evento.key === 'Escape' || evento.key.toLowerCase() === 'p') {
      evento.preventDefault();
      juego.reanudar();
    }
  }
</script>

<svelte:window onkeydown={alTeclear} />

<div class="velo-pausa">
  <div class="tarjeta-pausa" role="dialog" aria-modal="true" aria-labelledby={identificador}>
    <div class="icono" aria-hidden="true"><IconoDePausa /></div>
    <h2 id={identificador}>{textos.pausa.titulo}</h2>
    <p>{textos.pausa.subtitulo}</p>
    <button
      type="button"
      class="boton boton--principal"
      bind:this={continuar}
      onclick={() => juego.reanudar()}
    >
      {textos.pausa.continuar}
    </button>
  </div>
</div>

<style>
  /* Con el juego oculto detrás (main[inert]), el velo solo da el fondo de la pausa. */
  .velo-pausa {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--velo);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--espacio-4);
    overflow-y: auto;
  }
  .tarjeta-pausa {
    width: 100%;
    max-width: 440px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--espacio-4);
    padding: var(--espacio-8) var(--espacio-6);
    background: var(--superficie);
    border: 1px solid var(--borde);
    border-radius: var(--radio-xl);
    text-align: center;
  }
  .icono {
    font-size: 64px;
    line-height: 1;
    color: var(--acento);
    display: flex;
  }
  h2 {
    margin: 0;
    font-size: clamp(24px, 5vw, 30px);
    line-height: 1.2;
    color: var(--acento);
    overflow-wrap: anywhere;
  }
  p {
    margin: 0;
    color: var(--texto-suave);
    overflow-wrap: anywhere;
  }
</style>
