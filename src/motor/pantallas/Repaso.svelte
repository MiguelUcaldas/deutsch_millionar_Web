<script lang="ts">
  import ExplicacionTema from '../componentes/ExplicacionTema.svelte';
  import FiltrosTemas from '../componentes/FiltrosTemas.svelte';
  import PildorasDeTema from '../componentes/PildorasDeTema.svelte';
  import { obtenerJuego } from '../estado/juego.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;
</script>

<section class="pantalla" aria-label={textos.repasoTitulo}>
  <div class="contenedor contenedor--inicio">
    <header class="cabecera">
      <div>
        <h1>{textos.repasoTitulo}</h1>
        <p>{textos.repasoSubtitulo}</p>
      </div>
      <button type="button" class="boton boton--secundario" onclick={() => juego.irA('inicio')}>
        {textos.volver}
      </button>
    </header>
    <div>
      <FiltrosTemas />
    </div>
    <div class="rejilla">
      {#each juego.temasVisibles as tema (tema.id)}
        <button type="button" class="tema" onclick={() => juego.abrirTema(tema)}>
          <b>{tema.nombre_corto}</b>
          <PildorasDeTema {tema} />
          <span aria-hidden="true">›</span>
        </button>
      {/each}
    </div>
  </div>
</section>

{#if juego.temaAbierto}
  <ExplicacionTema tema={juego.temaAbierto} />
{/if}

<style>
  .cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--espacio-4);
  }
  h1 {
    margin: 0;
    font-size: clamp(26px, 3.5vw, 34px);
    font-weight: 800;
    line-height: 1.1;
  }
  .cabecera p {
    margin: 6px 0 0;
    color: var(--texto-suave);
  }
  .rejilla {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
    gap: var(--espacio-3);
  }
  .tema {
    min-height: 64px;
    min-width: 0;
    padding: 14px 16px;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie);
    text-align: left;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .tema b {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .tema:hover {
    border-color: var(--acento-borde);
    background: var(--superficie-2);
  }
  .tema span {
    color: var(--texto-suave);
  }
</style>
