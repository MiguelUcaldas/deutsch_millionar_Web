<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import ListaEscalera from './ListaEscalera.svelte';

  const { textos } = obtenerJuego();
</script>

<aside class="tarjeta escalera" aria-label={textos.escaleraTitulo}>
  <h2 class="etiqueta">{textos.escaleraTitulo}</h2>
  <ListaEscalera />
</aside>

<style>
  .escalera {
    flex: 1 1 240px;
    padding: 14px;
  }
  .etiqueta {
    margin: 4px 6px 10px;
  }
  /* Por debajo de 900 px la reemplaza la escalera compacta. */
  @media (max-width: 900px) {
    .escalera {
      display: none;
    }
  }
</style>
