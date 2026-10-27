<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;
</script>

<!-- Una fila de fichas por dimensión. Marcar varias suma valores; ninguna marcada significa «Todos». -->
{#each juego.filasDeFiltro as fila (fila.id)}
  <div class="fila" role="group" aria-label={fila.etiqueta}>
    <span class="etiqueta-fila">{fila.etiqueta}:</span>
    <div class="fichas">
      <button
        type="button"
        class="ficha"
        aria-pressed={!juego.filtros[fila.id]?.length}
        onclick={() => juego.quitarFiltro(fila.id)}
      >
        {textos.todos}
      </button>
      {#each fila.valores as valor (valor)}
        <button
          type="button"
          class="ficha"
          aria-pressed={juego.filtros[fila.id]?.includes(valor) ?? false}
          onclick={() => juego.alternarFiltro(fila.id, valor)}
        >
          {valor}
        </button>
      {/each}
    </div>
  </div>
{/each}

<style>
  .fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: var(--espacio-3);
    min-width: 0;
  }
  .etiqueta-fila {
    font-size: var(--texto-s);
    font-weight: 600;
    color: var(--texto-suave);
  }
  .fichas {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }
  .ficha {
    min-height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid var(--borde-fuerte);
    background: transparent;
    color: var(--texto-suave);
    font-size: var(--texto-s);
    font-weight: 600;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .ficha:hover {
    color: var(--texto);
  }
  .ficha[aria-pressed='true'] {
    border-color: var(--acento);
    background: var(--resaltado-fondo);
    color: var(--resaltado-texto);
  }
</style>
