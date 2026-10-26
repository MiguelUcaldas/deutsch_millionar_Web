<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  interface Pieza {
    texto: string;
    etiqueta: string;
    resaltar?: boolean;
  }
  let { piezas }: { piezas: Pieza[] } = $props();
  const { idioma } = obtenerJuego();
</script>

<div class="estructura">
  {#each piezas as pieza, i (i)}
    <div class="bloque" class:resaltado={pieza.resaltar}>
      <span class="texto" lang={idioma}>{pieza.texto}</span>
      <span class="etiqueta-pieza">{pieza.etiqueta}</span>
    </div>
  {/each}
</div>

<style>
  .estructura {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .bloque {
    min-width: 0;
    padding: 10px 16px;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .texto {
    font-size: 18px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .etiqueta-pieza {
    font-size: var(--texto-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--texto-suave);
    overflow-wrap: anywhere;
  }
  .resaltado {
    border: 1.5px solid var(--seleccion);
    background: var(--seleccion-fondo);
  }
  .resaltado .etiqueta-pieza {
    color: var(--seleccion-texto);
  }
</style>
