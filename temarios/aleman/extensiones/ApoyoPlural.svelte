<script lang="ts">
  import type { PropsVisual } from '@motor/contenido/esquemas';

  let { pregunta, momento }: PropsVisual = $props();

  const plural = $derived(String(pregunta.apoyo?.plural ?? ''));
</script>

<!-- Va dentro de «Oración completa», junto a la traducción. Solo en el resultado: durante la
     pregunta mostrar «die Tische» delataría el género. -->
{#if momento === 'resultado' && plural}
  <div class="plural" role="group" aria-label="Plural">
    <span class="insignia">Plural · Mehrzahl</span>
    <span class="forma" lang="de">{plural}</span>
    <span class="nota">En plural el artículo siempre es <b lang="de">die</b>.</span>
  </div>
{/if}

<style>
  .plural {
    align-self: flex-start;
    max-width: 100%;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--espacio-2) var(--espacio-3);
    padding: 10px 14px;
    border-radius: var(--radio-m);
    border: 1.5px solid var(--acento);
    background: var(--resaltado-fondo);
  }
  .insignia {
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid var(--acento);
    color: var(--resaltado-texto);
    font-size: var(--texto-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .forma {
    min-width: 0;
    font-size: clamp(20px, 3.2vw, 26px);
    font-weight: 800;
    line-height: 1.3;
    color: var(--resaltado-texto);
    overflow-wrap: break-word;
  }
  .nota {
    min-width: 0;
    font-size: var(--texto-s);
    color: var(--texto-suave);
  }
</style>
