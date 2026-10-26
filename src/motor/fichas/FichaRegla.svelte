<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  interface Punto {
    id: string;
    texto: string;
    ejemplos?: { original: string; traduccion: string }[];
  }
  interface Props {
    titulo: string;
    puntos: Punto[];
    nota?: string;
    resaltar?: string[];
  }
  let { titulo, puntos, nota, resaltar = [] }: Props = $props();
  const { idioma } = obtenerJuego();
</script>

<section class="ficha">
  <h3>{titulo}</h3>
  <ul>
    {#each puntos as punto (punto.id)}
      <li class="punto" class:resaltado={resaltar.includes(punto.id)}>
        <p class="texto">{punto.texto}</p>
        {#each punto.ejemplos ?? [] as ejemplo, i (i)}
          <p class="ejemplo">
            <span lang={idioma}>{ejemplo.original}</span> → <span>{ejemplo.traduccion}</span>
          </p>
        {/each}
      </li>
    {/each}
  </ul>
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
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .punto {
    padding: 12px 14px;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie-2);
    min-width: 0;
  }
  .texto {
    margin: 0;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .ejemplo {
    margin: 6px 0 0 12px;
    font-family: var(--fuente-mono);
    font-size: 14px;
    line-height: 1.5;
    color: var(--texto-suave);
    overflow-wrap: anywhere;
  }
  .resaltado {
    border: 1.5px solid var(--seleccion);
    background: var(--seleccion-fondo);
  }
  .resaltado .texto,
  .resaltado .ejemplo {
    color: var(--seleccion-texto);
  }
  .nota {
    margin: 12px 0 0;
    font-size: var(--texto-m);
    font-style: italic;
    color: var(--texto-suave);
  }
</style>
