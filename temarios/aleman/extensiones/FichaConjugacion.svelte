<script lang="ts">
  import type { PropsVisual } from '@motor/contenido/esquemas';
  import { buscarVerbo, verbos } from './verbos';

  let { pregunta }: PropsVisual = $props();

  const ficha = $derived(
    typeof pregunta.ficha === 'object'
      ? (pregunta.ficha as unknown as { verbo: string; persona: string; tiempo: string })
      : null,
  );
  const verbo = $derived(ficha ? buscarVerbo(ficha.verbo) : undefined);
  const formas = $derived(ficha && verbo ? verbo.tiempos[ficha.tiempo] : undefined);
  const tiempo = $derived(ficha ? verbos.tiempos[ficha.tiempo] : undefined);

  /** Separa la forma en raíz y terminación para resaltar la terminación. */
  function partir(forma: string, raiz: string | undefined) {
    return raiz && forma.startsWith(raiz)
      ? { raiz, terminacion: forma.slice(raiz.length) }
      : { raiz: forma, terminacion: '' };
  }
</script>

{#if ficha && verbo && formas}
  <section class="ficha">
    <h3>
      <span lang="de">{verbo.infinitivo}</span> · {verbos.tipos[verbo.tipo] ?? verbo.tipo} ·
      <span lang="de">{tiempo?.de}</span> ({tiempo?.es})
    </h3>
    <p class="traduccion">{verbo.traduccion}</p>

    <table>
      <tbody>
        {#each verbos.personas as persona (persona.id)}
          {@const forma = formas[persona.id]}
          {@const actual = persona.id === ficha.persona}
          {#if forma}
            {@const partes = partir(forma.de, verbo.raiz)}
            <tr class:actual aria-current={actual ? 'true' : undefined}>
              <th scope="row" lang="de"
                ><span class="marca">{actual ? '▶' : ''}</span>{persona.de}</th
              >
              <td lang="de" class="forma"
                >{partes.raiz}<strong class="terminacion">{partes.terminacion}</strong></td
              >
              <td class="espanol">{persona.es}{forma.especial ? ' ●' : ''}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>

    {#if verbo.nota}
      <p class="nota">{verbo.nota}</p>
    {/if}
  </section>
{/if}

<style>
  .ficha {
    min-width: 0;
  }
  h3 {
    margin: 0;
    color: var(--acento);
    font-size: 17px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .traduccion,
  .nota {
    color: var(--texto-suave);
    font-style: italic;
    line-height: 1.5;
  }
  .traduccion {
    margin: 2px 0 10px;
  }
  .nota {
    margin: 10px 0 0;
    font-size: 15px;
  }
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 4px;
  }
  th,
  td {
    padding: 8px 12px;
    background: var(--superficie-2);
    text-align: left;
    overflow-wrap: anywhere;
  }
  th {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-weight: 600;
    border-radius: 8px 0 0 8px;
  }
  td:last-child {
    border-radius: 0 8px 8px 0;
  }
  .marca {
    display: inline-block;
    width: 1.5ch;
  }
  .forma {
    font-family: 'JetBrains Mono', Consolas, monospace;
  }
  .terminacion {
    color: var(--acento);
  }
  .espanol {
    color: var(--texto-suave);
  }
  tr.actual th,
  tr.actual td {
    background: var(--seleccion-fondo);
    color: var(--seleccion-texto);
  }
  tr.actual .terminacion {
    color: var(--seleccion-texto);
  }
</style>
