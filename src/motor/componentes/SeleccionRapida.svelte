<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;

  /** `mixed` cuando solo algunos de los temas del valor están marcados. */
  const presionada = (dimension: string, valor: string) => {
    const estado = juego.estadoDeFicha(dimension, valor);
    return estado === 'todos' ? 'true' : estado === 'algunos' ? 'mixed' : 'false';
  };
</script>

<!-- Seleccionar: [Todos] [Ninguno] | Nivel: [A1] [A2]. Las fichas solo marcan y desmarcan casillas. -->
<div class="fila" role="group" aria-label={textos.seleccionar}>
  <span class="etiqueta-fila" lang="es">{textos.seleccionar}</span>
  <div class="fichas">
    <button type="button" class="ficha" lang="es" onclick={() => juego.elegirTodos(true)}>
      {textos.todos}
    </button>
    <button type="button" class="ficha" lang="es" onclick={() => juego.elegirTodos(false)}>
      {textos.ninguno}
    </button>
  </div>

  {#each juego.filasDeFiltro as fila (fila.id)}
    <span class="separador" role="separator" aria-orientation="vertical"></span>
    <div class="grupo" role="group" aria-label={fila.etiqueta}>
      <span class="etiqueta-fila" lang="es">{fila.etiqueta}:</span>
      <div class="fichas">
        {#each fila.valores as valor (valor)}
          <button
            type="button"
            class="ficha"
            aria-pressed={presionada(fila.id, valor)}
            onclick={() => juego.alternarNivel(fila.id, valor)}
          >
            {valor}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: var(--espacio-3);
    min-width: 0;
  }
  .grupo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
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
  .separador {
    align-self: stretch;
    min-height: 24px;
    width: 1px;
    background: var(--borde-fuerte);
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
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .ficha:hover {
    color: var(--texto);
  }
  .ficha[aria-pressed='true'] {
    border-color: var(--acento);
    background: var(--resaltado-fondo);
    color: var(--resaltado-texto);
  }
  /* Algunos temas del nivel marcados: borde punteado y sin relleno. */
  .ficha[aria-pressed='mixed'] {
    border: 1px dashed var(--acento);
    background: transparent;
    color: var(--texto);
  }
  /* Al envolverse en celular el separador quedaría suelto al borde de una línea. */
  @media (max-width: 560px) {
    .separador {
      display: none;
    }
  }
</style>
