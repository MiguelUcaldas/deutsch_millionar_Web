<script lang="ts">
  import type { Tema } from '../contenido/esquemas';
  import { obtenerJuego } from '../estado/juego.svelte';

  let { tema }: { tema: Pick<Tema, 'filtros'> } = $props();
  const dimensiones = obtenerJuego().configuracion.filtrosTemas ?? [];
</script>

<!-- El valor de cada dimensión de filtro del tema (por ejemplo su nivel), en una píldora pequeña. -->
{#each dimensiones as dimension (dimension.id)}
  {#if tema.filtros?.[dimension.id]}
    <span class="pildora numeros" title={dimension.etiqueta}>{tema.filtros[dimension.id]}</span>
  {/if}
{/each}

<style>
  .pildora {
    flex: none;
    font-size: var(--texto-xs);
    font-weight: 600;
    color: var(--acento);
    border: 1px solid var(--borde-fuerte);
    border-radius: 999px;
    padding: 2px 8px;
  }
</style>
