<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import type { SegmentoOracion } from '../juego/oraciones';

  interface Props {
    segmentos: SegmentoOracion[];
    /** Texto que se lee en voz alta si difiere de la oración completa. */
    pronunciar?: string;
  }

  let { segmentos, pronunciar }: Props = $props();
  const { idioma, voz, textos } = obtenerJuego();

  const textoPlano = $derived(segmentos.map((s) => s.texto).join(''));
</script>

<div class="fila">
  <p class="oracion" lang={idioma}>
    {#each segmentos as segmento, i (i)}
      {#if segmento.insertado}<mark>{segmento.texto}</mark>{:else}{segmento.texto}{/if}
    {/each}
  </p>
  <!-- Sin voz para el idioma del contenido el botón no se muestra. -->
  {#if voz.disponible}
    <button
      type="button"
      class="boton-icono"
      aria-label={voz.hablando ? textos.detenerAudio : textos.escuchar}
      aria-pressed={voz.hablando}
      onclick={() => (voz.hablando ? voz.detener() : voz.hablar(pronunciar ?? textoPlano))}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      </svg>
    </button>
  {/if}
</div>

<style>
  .fila {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    width: 100%;
  }
  .oracion {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: clamp(24px, 3vw, 30px);
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  mark {
    background: var(--resaltado-fondo);
    color: var(--resaltado-texto);
    border-radius: 6px;
    padding: 0 6px;
  }
</style>
