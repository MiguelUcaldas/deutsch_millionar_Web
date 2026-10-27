<script lang="ts">
  import type { PropsVisual } from '@motor/contenido/esquemas';

  let { pregunta, momento }: PropsVisual = $props();

  const singular = $derived(String(pregunta.apoyo?.singular ?? ''));
  const plural = $derived(String(pregunta.apoyo?.plural ?? ''));
</script>

<!-- Solo en el resultado: durante la pregunta mostrar «die Tische» delataría el género. -->
{#if momento === 'resultado' && singular && plural}
  <div class="plural" role="group" aria-label="Singular y plural">
    <p class="insignia">Plural · Mehrzahl</p>
    <div class="par">
      <div class="forma">
        <span class="rotulo">Singular</span>
        <span class="palabra" lang="de">{singular}</span>
      </div>
      <span class="flecha" aria-hidden="true">→</span>
      <div class="forma destacada">
        <span class="rotulo">Plural</span>
        <span class="palabra" lang="de">{plural}</span>
      </div>
    </div>
    <p class="nota">En plural el artículo siempre es <b lang="de">die</b>.</p>
  </div>
{/if}

<style>
  .plural {
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--espacio-3);
    text-align: center;
  }
  .insignia {
    margin: 0;
    padding: 3px 12px;
    border-radius: 999px;
    border: 1px solid var(--acento);
    background: var(--resaltado-fondo);
    color: var(--resaltado-texto);
    font-size: var(--texto-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .par {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--espacio-3) var(--espacio-4);
    min-width: 0;
  }
  .forma {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 10px 18px;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie-hundida);
  }
  .forma.destacada {
    border: 1.5px solid var(--acento);
    background: var(--resaltado-fondo);
  }
  .rotulo {
    font-size: var(--texto-xs);
    font-weight: 600;
    color: var(--texto-suave);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .destacada .rotulo {
    color: var(--resaltado-texto);
  }
  .palabra {
    min-width: 0;
    font-size: clamp(20px, 3.2vw, 26px);
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .destacada .palabra {
    color: var(--resaltado-texto);
  }
  .flecha {
    font-size: 24px;
    color: var(--texto-suave);
  }
  .nota {
    margin: 0;
    font-size: var(--texto-s);
    color: var(--texto-suave);
  }
</style>
