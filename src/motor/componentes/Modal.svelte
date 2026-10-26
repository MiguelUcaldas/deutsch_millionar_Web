<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { obtenerJuego } from '../estado/juego.svelte';

  interface Props {
    titulo: string;
    subtitulo?: string;
    /** `hoja` ancla el modal abajo, como la escalera en celular. */
    variante?: 'centrado' | 'hoja';
    alCerrar: () => void;
    children: Snippet;
    /** Botones extra en el pie, a la izquierda de «Cerrar». */
    acciones?: Snippet;
  }

  let { titulo, subtitulo, variante = 'centrado', alCerrar, children, acciones }: Props = $props();
  const { textos } = obtenerJuego();

  let botonCerrar: HTMLButtonElement;
  const identificador = `modal-${Math.random().toString(36).slice(2, 8)}`;

  onMount(() => {
    // Al cerrar, el foco vuelve al botón que abrió el modal.
    const origen = document.activeElement as HTMLElement | null;
    botonCerrar.focus();
    return () => origen?.focus?.();
  });

  function alTeclear(evento: KeyboardEvent) {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      alCerrar();
    }
  }

  /** Mantiene el tabulador dentro del modal. */
  function atraparFoco(evento: KeyboardEvent) {
    if (evento.key !== 'Tab') return;
    const focalizables = (evento.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    );
    const primero = focalizables[0];
    const ultimo = focalizables[focalizables.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo?.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero?.focus();
    }
  }
</script>

<svelte:window onkeydown={alTeclear} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="velo"
  class:hoja={variante === 'hoja'}
  onclick={(evento) => evento.target === evento.currentTarget && alCerrar()}
>
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby={identificador}
    tabindex="-1"
    onkeydown={atraparFoco}
  >
    <div class="cabecera">
      <div class="titulos">
        <h2 id={identificador}>{titulo}</h2>
        {#if subtitulo}<p>{subtitulo}</p>{/if}
      </div>
      <button
        type="button"
        class="boton-icono"
        aria-label={textos.cerrar}
        bind:this={botonCerrar}
        onclick={alCerrar}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg
        >
      </button>
    </div>
    <div class="cuerpo">
      {@render children()}
    </div>
    <div class="pie">
      {#if acciones}{@render acciones()}{/if}
      <button type="button" class="boton boton--secundario" onclick={alCerrar}
        >{textos.cerrar}</button
      >
    </div>
  </div>
</div>

<style>
  .velo {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--velo);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 6vh var(--espacio-4);
    overflow-y: auto;
    animation: entrada 0.2s ease-out;
  }
  .velo.hoja {
    align-items: flex-end;
    padding: var(--espacio-4) var(--espacio-4) 0;
  }
  .modal {
    width: 100%;
    max-width: 720px;
    min-width: 0;
    background: var(--superficie);
    border: 1px solid var(--borde);
    border-radius: var(--radio-xl);
    display: flex;
    flex-direction: column;
    max-height: 88vh;
  }
  .hoja .modal {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .cabecera {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--espacio-4);
    padding: var(--espacio-6) var(--espacio-6) var(--espacio-4);
    border-bottom: 1px solid var(--borde);
  }
  .titulos {
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: 26px;
    color: var(--acento);
    line-height: 1.2;
  }
  .titulos p {
    margin: 6px 0 0;
    font-style: italic;
    color: var(--texto-suave);
  }
  .cuerpo {
    padding: var(--espacio-5) var(--espacio-6);
    overflow-y: auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--espacio-5);
  }
  .pie {
    padding: var(--espacio-4) var(--espacio-6);
    border-top: 1px solid var(--borde);
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--espacio-3);
  }
  @media (max-width: 560px) {
    .cabecera,
    .cuerpo,
    .pie {
      padding-left: var(--espacio-4);
      padding-right: var(--espacio-4);
    }
  }
</style>
