<script lang="ts">
  import type { Pregunta } from '../contenido/esquemas';
  import { obtenerJuego } from '../estado/juego.svelte';
  import FichaEscala from './FichaEscala.svelte';
  import FichaRegla from './FichaRegla.svelte';
  import FichaTabla from './FichaTabla.svelte';

  interface Props {
    /** Id de un archivo de `fichas/` o un objeto `{ tipo, ... }` que resuelve una extensión. */
    ficha: Pregunta['ficha'];
    /** Necesaria para las fichas de extensión. */
    pregunta?: Pregunta;
    resaltar?: string[];
    flecha?: [string, string];
    momento?: 'pregunta' | 'resultado';
  }

  let { ficha, pregunta, resaltar = [], flecha, momento = 'resultado' }: Props = $props();
  const juego = obtenerJuego();

  const generica = $derived(typeof ficha === 'string' ? juego.banco?.fichas[ficha] : undefined);
  const Extension = $derived(
    typeof ficha === 'object' && ficha ? juego.registro.fichas[ficha.tipo] : undefined,
  );
</script>

{#if generica?.tipo === 'tabla'}
  <FichaTabla {...generica} {resaltar} {flecha} />
{:else if generica?.tipo === 'escala'}
  <FichaEscala {...generica} {resaltar} />
{:else if generica?.tipo === 'regla'}
  <FichaRegla {...generica} {resaltar} />
{:else if Extension && pregunta}
  <Extension {pregunta} {momento} {resaltar} {flecha} />
{/if}
