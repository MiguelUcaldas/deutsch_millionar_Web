<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  // El temario puede traer su propio ícono (`extensiones.iconoPausa`); si no, dos barras.
  const Icono = obtenerJuego().registro.iconoPausa;
</script>

{#if Icono}
  <Icono />
{:else}
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="M9 5v14M15 5v14" />
  </svg>
{/if}
