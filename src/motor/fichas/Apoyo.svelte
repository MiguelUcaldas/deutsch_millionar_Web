<script lang="ts">
  import type { Pregunta } from '../contenido/esquemas';
  import { obtenerJuego } from '../estado/juego.svelte';

  let { pregunta, momento }: { pregunta: Pregunta; momento: 'pregunta' | 'resultado' } = $props();
  const juego = obtenerJuego();

  // Apoyo visual aportado por el temario (un reloj, una imagen...). El motor no trae ninguno.
  const Componente = $derived(
    pregunta.apoyo ? juego.registro.apoyos[pregunta.apoyo.tipo] : undefined,
  );
</script>

{#if Componente}
  <Componente {pregunta} {momento} resaltar={pregunta.resaltar} />
{/if}
