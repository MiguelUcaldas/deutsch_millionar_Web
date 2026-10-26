<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  const juego = obtenerJuego();
</script>

<!-- Solo con ?debug en la URL: registro de los eventos de la partida. -->
<details class="depuracion" open>
  <summary>Registro de eventos ({juego.eventos.length})</summary>
  <ol>
    {#each juego.eventos as evento, i (i)}
      <li>{evento}</li>
    {/each}
  </ol>
</details>

<style>
  .depuracion {
    max-width: var(--ancho-contenido);
    margin: 0 auto var(--espacio-6);
    padding: var(--espacio-3) var(--espacio-4);
    border: 1px dashed var(--borde-fuerte);
    border-radius: var(--radio-m);
    font-family: var(--fuente-mono);
    font-size: var(--texto-xs);
    color: var(--texto-suave);
  }
  ol {
    margin: var(--espacio-2) 0 0;
    padding-left: 24px;
    max-height: 200px;
    overflow-y: auto;
  }
  li {
    overflow-wrap: anywhere;
  }
</style>
