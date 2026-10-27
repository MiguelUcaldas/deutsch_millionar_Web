<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import IconoDePausa from './IconoDePausa.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;
</script>

<button
  type="button"
  class="boton-icono boton-pausa"
  aria-label={textos.pausa.boton}
  title={textos.pausa.boton}
  data-pausa
  onclick={() => juego.pausar()}
>
  <IconoDePausa />
</button>

<style>
  .boton-pausa {
    font-size: 20px;
  }
</style>
