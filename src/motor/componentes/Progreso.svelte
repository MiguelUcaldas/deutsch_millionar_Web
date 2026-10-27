<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import { formatearDinero, totalPreguntas } from '../juego/premios';
  import { rellenar } from '../textos';

  const juego = obtenerJuego();
  const { textos, configuracion } = juego;

  const progreso = $derived(juego.progreso);
  const pendientes = $derived(juego.pendientes);
  const hayPreguntasFalladas = $derived(Object.keys(progreso.preguntas).length > 0);

  function borrar() {
    if (confirm(textos.progresoConfirmarBorrado)) juego.borrarProgreso();
  }
</script>

<section class="tarjeta" aria-labelledby="titulo-progreso">
  <div class="cabecera">
    <h2 id="titulo-progreso">{textos.progresoTitulo}</h2>
    {#if juego.hayProgreso}
      <button type="button" class="boton boton--pequeno" onclick={borrar}>
        {textos.progresoBorrar}
      </button>
    {/if}
  </div>

  {#if !juego.hayProgreso}
    <p class="vacio">{textos.progresoVacio}</p>
  {:else}
    <div class="datos">
      <div class="dato">
        <span class="nombre">{textos.progresoMejorPartida}</span>
        <span class="valor numeros">
          {rellenar(textos.progresoMejorPartidaValor, {
            n: progreso.mejorPregunta,
            total: totalPreguntas(configuracion.juego),
          })}
        </span>
      </div>
      <div class="dato">
        <span class="nombre">{textos.progresoMayorPremio}</span>
        <span class="valor premio numeros">
          {formatearDinero(configuracion.moneda, progreso.mejorPremio)}
        </span>
      </div>
      <div class="dato">
        <span class="nombre">{textos.progresoPartidas}</span>
        <span class="valor numeros">{progreso.partidas}</span>
      </div>
      <div class="dato">
        <span class="nombre">{textos.progresoVictorias}</span>
        <span class="valor numeros">{progreso.victorias}</span>
      </div>
    </div>

    {#if juego.temasFallados.length > 0}
      <h3>{textos.progresoTemasFallados}</h3>
      <ul class="fallados">
        {#each juego.temasFallados as tema (tema.tema)}
          <li>
            <span class="nombre-tema">{tema.nombre}</span>
            <span class="tasa numeros">
              {rellenar(textos.progresoTasaDeFallo, { pct: Math.round(tema.tasaDeFallo * 100) })}
            </span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if hayPreguntasFalladas}
      <div class="repaso">
        <button
          type="button"
          class="boton boton--secundario"
          disabled={pendientes.length === 0}
          onclick={() => juego.repasarFallos()}
        >
          {textos.progresoRepasarFallos}
        </button>
        <span class="pendientes">
          {pendientes.length > 0
            ? rellenar(textos.progresoPendientes, { n: pendientes.length })
            : textos.progresoSinPendientes}
        </span>
      </div>
    {/if}
  {/if}
</section>

<style>
  .cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--espacio-3);
    margin-bottom: 18px;
  }
  h2 {
    margin: 0;
    font-size: 20px;
  }
  h3 {
    margin: 20px 0 10px;
    font-size: 16px;
  }
  .vacio {
    margin: 0;
    color: var(--texto-suave);
  }
  .datos {
    display: flex;
    flex-wrap: wrap;
    gap: var(--espacio-3);
  }
  .dato {
    flex: 1 1 180px;
    min-width: 0;
    padding: var(--espacio-4);
    border-radius: 14px;
    background: var(--superficie-2);
    border: 1px solid var(--borde);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .nombre {
    font-size: var(--texto-s);
    font-weight: 600;
    color: var(--texto-suave);
  }
  .valor {
    font-size: 24px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .premio {
    color: var(--acento);
  }
  .fallados {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .fallados li {
    display: flex;
    justify-content: space-between;
    gap: var(--espacio-3);
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--superficie-hundida);
    border: 1px solid var(--borde);
  }
  .nombre-tema {
    min-width: 0;
    font-weight: 600;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .tasa {
    flex: none;
    color: var(--incorrecto-texto);
    font-size: var(--texto-s);
  }
  .repaso {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--espacio-3);
    margin-top: 20px;
  }
  .pendientes {
    font-size: 14px;
    color: var(--texto-suave);
  }
  .repaso .boton:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
</style>
