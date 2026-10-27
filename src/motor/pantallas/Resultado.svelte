<script lang="ts">
  import { onMount } from 'svelte';
  import BotonPausa from '../componentes/BotonPausa.svelte';
  import ExplicacionTema from '../componentes/ExplicacionTema.svelte';
  import Oracion from '../componentes/Oracion.svelte';
  import { obtenerJuego } from '../estado/juego.svelte';
  import Apoyo from '../fichas/Apoyo.svelte';
  import Ficha from '../fichas/Ficha.svelte';
  import FichaEstructura from '../fichas/FichaEstructura.svelte';
  import { reconstruirOracion } from '../juego/oraciones';
  import { formatearDinero, premioDePregunta } from '../juego/premios';
  import { rellenar } from '../textos';

  const juego = obtenerJuego();
  const { textos, configuracion } = juego;

  const estado = $derived(juego.estado);
  const pregunta = $derived(estado.preguntaActual!);
  const acierto = $derived(estado.acerto === true);
  const tema = $derived(juego.temaDe(pregunta.tema));
  const segmentos = $derived(reconstruirOracion(pregunta));
  const veredicto = $derived(acierto ? textos.acierto : textos.fallo);

  let titulo: HTMLHeadingElement;
  // El foco va al veredicto para que el lector de pantalla lo anuncie.
  onMount(() => titulo.focus());
</script>

<section class="pantalla" aria-label={veredicto.titulo}>
  <div class="contenedor contenedor--lectura">
    <section class="tarjeta veredicto" class:acierto class:fallo={!acierto}>
      <div class="icono" aria-hidden="true">
        {#if acierto}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg
          >
        {:else}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg
          >
        {/if}
      </div>
      <div class="textos-veredicto">
        <h1 tabindex="-1" bind:this={titulo}>{veredicto.titulo}</h1>
        {#if veredicto.subtitulo}<p>{veredicto.subtitulo}</p>{/if}
      </div>
      <span class="chip numeros">
        {#if estado.practica}
          {rellenar(textos.preguntaDe, {
            n: estado.numeroPregunta,
            total: estado.practica.cola.length,
          })}
        {:else}
          {rellenar(textos.preguntaPremio, {
            n: estado.numeroPregunta,
            premio: formatearDinero(
              configuracion.moneda,
              premioDePregunta(configuracion.juego, estado.numeroPregunta),
            ),
          })}
        {/if}
      </span>
    </section>

    <section class="tarjeta bloque">
      <h2 class="etiqueta">{textos.oracionCompleta}</h2>
      <Oracion {segmentos} pronunciar={pregunta.pronunciar} />
      {#if pregunta.traduccion}<p class="traduccion">{pregunta.traduccion}</p>{/if}
      <!-- Un apoyo con `lugar: "oracion"` va aquí, junto a la oración y su traducción. -->
      {#if pregunta.apoyo?.lugar === 'oracion'}<Apoyo {pregunta} momento="resultado" />{/if}
      {#if estado.motivoFin === 'tiempo'}
        <p class="tu-respuesta">{textos.seAcaboElTiempo}</p>
      {:else if !acierto && estado.opcionElegida}
        <p class="tu-respuesta">{textos.tuRespuesta}: {estado.opcionElegida} ✗</p>
      {/if}
    </section>

    <section class="tarjeta bloque">
      <h2 class="etiqueta">{textos.explicacion}</h2>
      <p class="explicacion">{pregunta.explicacion}</p>
    </section>

    {#if pregunta.estructura?.length}
      <section class="tarjeta bloque">
        <h2 class="etiqueta">{textos.estructura}</h2>
        <FichaEstructura piezas={pregunta.estructura} />
      </section>
    {/if}

    {#if pregunta.apoyo && pregunta.apoyo.lugar !== 'oracion'}
      <section class="tarjeta apoyo">
        <Apoyo {pregunta} momento="resultado" />
      </section>
    {/if}

    {#if pregunta.ficha}
      <section class="tarjeta bloque">
        <h2 class="etiqueta">{textos.fichaDeLaRegla}</h2>
        <Ficha
          ficha={pregunta.ficha}
          {pregunta}
          resaltar={pregunta.resaltar}
          flecha={pregunta.flecha}
          momento="resultado"
        />
      </section>
    {/if}

    <div class="barra-inferior">
      <div class="contenido-barra">
        <BotonPausa />
        {#if tema}
          <button
            type="button"
            class="boton boton--secundario"
            onclick={() => juego.abrirTema(tema)}
          >
            {rellenar(textos.queEsTema, { tema: tema.nombre_corto })}
          </button>
        {/if}
        <button type="button" class="boton boton--principal" onclick={() => juego.siguiente()}>
          {textos.siguiente} <kbd>Enter</kbd>
        </button>
      </div>
    </div>
  </div>
</section>

{#if juego.temaAbierto}
  <ExplicacionTema tema={juego.temaAbierto} />
{/if}

<style>
  .veredicto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
  }
  .icono {
    flex: none;
    width: 60px;
    height: 60px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .textos-veredicto {
    flex: 1 1 240px;
    min-width: 0;
  }
  h1 {
    margin: 0;
    font-size: var(--texto-veredicto);
    font-weight: 800;
    line-height: 1.1;
  }
  h1:focus {
    outline: none;
  }
  .textos-veredicto p {
    margin: 6px 0 0;
    font-size: var(--texto-l);
    color: var(--texto-suave);
  }
  .acierto .icono {
    background: var(--correcto-fondo);
    color: var(--correcto-texto);
  }
  .acierto h1 {
    color: var(--correcto-texto);
  }
  .fallo .icono {
    background: var(--incorrecto-fondo);
    color: var(--incorrecto-texto);
  }
  .fallo h1 {
    color: var(--titulo-fallo);
  }

  .bloque {
    display: flex;
    flex-direction: column;
    gap: var(--espacio-3);
  }
  .traduccion {
    margin: 0;
    font-size: var(--texto-l);
    font-style: italic;
    color: var(--texto-suave);
  }
  .tu-respuesta {
    align-self: flex-start;
    margin: 4px 0 0;
    font-size: var(--texto-m);
    font-weight: 600;
    color: var(--incorrecto-texto);
    background: var(--incorrecto-fondo);
    border: 1px solid color-mix(in srgb, var(--incorrecto) 45%, transparent);
    border-radius: 10px;
    padding: 8px 12px;
    overflow-wrap: anywhere;
  }
  .explicacion {
    margin: 0;
    font-size: var(--texto-l);
    line-height: 1.65;
  }
  .apoyo {
    display: flex;
    justify-content: center;
  }

  .barra-inferior {
    position: sticky;
    bottom: 0;
    background: color-mix(in srgb, var(--fondo) 94%, transparent);
    border-top: 1px solid var(--borde);
    margin: var(--espacio-6) calc(-1 * var(--espacio-5)) calc(-1 * var(--espacio-8));
  }
  .contenido-barra {
    max-width: var(--ancho-lectura);
    margin: 0 auto;
    padding: 14px var(--espacio-5);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--espacio-3);
  }
  @media (max-width: 560px) {
    .barra-inferior {
      margin-left: calc(-1 * var(--espacio-4));
      margin-right: calc(-1 * var(--espacio-4));
      margin-bottom: calc(-1 * var(--espacio-6));
    }
  }
</style>
