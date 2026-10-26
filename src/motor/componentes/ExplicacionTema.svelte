<script lang="ts">
  import type { Tema } from '../contenido/esquemas';
  import { obtenerJuego } from '../estado/juego.svelte';
  import Ficha from '../fichas/Ficha.svelte';
  import Modal from './Modal.svelte';

  let { tema }: { tema: Tema } = $props();
  const juego = obtenerJuego();
  const { textos, idioma } = juego;
  // Solo desde el repaso (fuera de una partida) se ofrece practicar el tema.
  const desdeRepaso = $derived(juego.pantalla === 'repaso');
</script>

<Modal
  titulo={tema.titulo}
  subtitulo={tema.resumen}
  alCerrar={() => juego.cerrarTema()}
  acciones={desdeRepaso ? practicar : undefined}
>
  <section>
    <h3>{textos.temaQueEs}</h3>
    <p>{tema.que_es}</p>
  </section>
  {#if tema.como_reconocerlo.length > 0}
    <section>
      <h3>{textos.temaComoReconocerlo}</h3>
      <ul>
        {#each tema.como_reconocerlo as punto, i (i)}<li>{punto}</li>{/each}
      </ul>
    </section>
  {/if}
  {#if tema.ejemplos.length > 0}
    <section>
      <h3>{textos.temaEjemplos}</h3>
      <div class="ejemplos">
        {#each tema.ejemplos as ejemplo, i (i)}
          <div class="ejemplo">
            <span class="original" lang={idioma}>{ejemplo.original}</span>
            <span class="traduccion">{ejemplo.traduccion}</span>
          </div>
        {/each}
      </div>
    </section>
  {/if}
  {#if tema.errores_comunes.length > 0}
    <section>
      <h3>{textos.temaErroresComunes}</h3>
      <ul>
        {#each tema.errores_comunes as error, i (i)}<li>{error}</li>{/each}
      </ul>
    </section>
  {/if}
  {#if tema.ficha_principal}
    <section>
      <h3 class="etiqueta">{textos.temaFicha}</h3>
      <Ficha ficha={tema.ficha_principal} />
    </section>
  {/if}
</Modal>

{#snippet practicar()}
  <button type="button" class="boton boton--principal" onclick={() => juego.practicarTema(tema.id)}>
    {textos.practicarTema}
  </button>
{/snippet}

<style>
  section {
    min-width: 0;
  }
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
  }
  h3.etiqueta {
    margin-bottom: 10px;
  }
  p,
  ul {
    margin: 0;
    line-height: 1.6;
  }
  ul {
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ejemplos {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ejemplo {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--superficie-2);
  }
  .original {
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .traduccion {
    color: var(--texto-suave);
    overflow-wrap: anywhere;
  }
</style>
