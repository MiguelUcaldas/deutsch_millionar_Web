<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  interface Elemento {
    id: string;
    original: string;
    traduccion: string;
  }
  interface Props {
    titulo: string;
    desde: string;
    hasta: string;
    elementos: Elemento[];
    nota?: string;
    resaltar?: string[];
  }
  let { titulo, desde, hasta, elementos, nota, resaltar = [] }: Props = $props();
  const { idioma } = obtenerJuego();
</script>

<section class="ficha">
  <h3>{titulo}</h3>
  <div class="escala">
    <span class="extremo">{desde}</span>
    {#each elementos as elemento (elemento.id)}
      <div class="caja" class:resaltada={resaltar.includes(elemento.id)}>
        <span class="original" lang={idioma}>{elemento.original}</span>
        <span class="traduccion">{elemento.traduccion}</span>
      </div>
    {/each}
    <span class="extremo">{hasta}</span>
  </div>
  {#if nota}<p class="nota">{nota}</p>{/if}
</section>

<style>
  .ficha {
    min-width: 0;
  }
  h3 {
    margin: 6px 0 12px;
    font-size: 20px;
  }
  .escala {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .extremo {
    font-size: var(--texto-s);
    font-style: italic;
    color: var(--texto-suave);
  }
  .caja {
    min-width: 0;
    padding: 8px 12px;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie-2);
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }
  .original {
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .traduccion {
    font-size: var(--texto-xs);
    color: var(--texto-suave);
  }
  .resaltada {
    border: 1.5px solid var(--seleccion);
    background: var(--seleccion-fondo);
  }
  .resaltada .original,
  .resaltada .traduccion {
    color: var(--seleccion-texto);
  }
  .nota {
    margin: 12px 0 0;
    font-size: var(--texto-m);
    font-style: italic;
    color: var(--texto-suave);
  }
</style>
