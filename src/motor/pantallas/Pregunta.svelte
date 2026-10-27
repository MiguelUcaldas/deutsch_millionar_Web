<script lang="ts">
  import BarraTiempo from '../componentes/BarraTiempo.svelte';
  import Comodines from '../componentes/Comodines.svelte';
  import Contador from '../componentes/Contador.svelte';
  import Aviso from '../componentes/Aviso.svelte';
  import BotonPausa from '../componentes/BotonPausa.svelte';
  import Escalera from '../componentes/Escalera.svelte';
  import EscaleraCompacta from '../componentes/EscaleraCompacta.svelte';
  import Marquesina from '../componentes/Marquesina.svelte';
  import Opcion, { type EstadoOpcion } from '../componentes/Opcion.svelte';
  import { obtenerJuego } from '../estado/juego.svelte';
  import Apoyo from '../fichas/Apoyo.svelte';
  import {
    formatearDinero,
    premioDePregunta,
    segundosDePregunta,
    totalPreguntas,
  } from '../juego/premios';
  import { parpadeosDeSuspenso } from '../juego/suspenso';
  import { rellenar } from '../textos';

  const juego = obtenerJuego();
  const { textos, idioma, configuracion } = juego;
  const reglas = configuracion.juego;
  const LETRAS = ['A', 'B', 'C', 'D'];

  const estado = $derived(juego.estado);
  const pregunta = $derived(estado.preguntaActual!);
  const tema = $derived(juego.temaDe(pregunta.tema));
  const revelada = $derived(estado.fase === 'revelacion');
  const enSuspenso = $derived(estado.fase === 'suspenso');

  const practica = $derived(estado.practica);
  const total = $derived(practica ? practica.cola.length : totalPreguntas(reglas));
  const totalSegundos = $derived(practica ? 1 : segundosDePregunta(reglas, estado.numeroPregunta));
  const enAlerta = $derived(
    !practica &&
      estado.fase === 'pregunta' &&
      juego.segundos <= reglas.segundosAlerta &&
      juego.segundos > 0,
  );

  function estadoDeOpcion(opcion: string): EstadoOpcion {
    if (estado.opcionesEliminadas.includes(opcion)) return 'eliminada';
    if (enSuspenso) {
      if (opcion !== estado.opcionElegida) return 'apagada';
      return estado.suspensoEnSilencio ? 'suspensoFijo' : 'suspenso';
    }
    if (revelada) {
      if (opcion === pregunta.correcta) return 'correcta';
      return opcion === estado.opcionElegida ? 'incorrecta' : 'apagada';
    }
    return 'normal';
  }

  // El enunciado se parte en los huecos: al revelar, cada hueco muestra su parte de la respuesta.
  const trozos = $derived(pregunta.enunciado.split('___'));
  const partesDeLaRespuesta = $derived(pregunta.correcta.split(' / '));
  const rellenoDeHueco = (i: number) => {
    const parte = partesDeLaRespuesta[i] ?? '';
    return parte === '—' ? '' : parte;
  };

  // El parpadeo de la opción elegida dura lo que suena el suspenso.
  const parpadeo = parpadeosDeSuspenso(reglas.duracionesMs.suspensoSonando);

  // Los marcadores de la marquesina rotan con cada pregunta.
  const frase = $derived(configuracion.marquesina[estado.turno % configuracion.marquesina.length]!);
</script>

<section
  class="pantalla"
  aria-label={rellenar(textos.preguntaDe, { n: estado.numeroPregunta, total })}
  style:--parpadeos={parpadeo.cantidad}
  style:--ciclo-parpadeo="{parpadeo.cicloMs}ms"
  style:--duracion-publico="{reglas.duracionesMs.barrasPublico}ms"
>
  <div class="contenedor">
    <header class="tarjeta barra-juego">
      <div class="fila-barra">
        <div class="progreso">
          {#if practica}
            <span class="titulo-practica"
              >{rellenar(textos.practicaDe, { titulo: practica.titulo })}</span
            >
          {/if}
          <span class="numero-pregunta">
            {rellenar(textos.preguntaDe, { n: estado.numeroPregunta, total })}
          </span>
          {#if !practica}
            <span class="premio numeros">
              {formatearDinero(
                configuracion.moneda,
                premioDePregunta(reglas, estado.numeroPregunta),
              )}
            </span>
          {/if}
        </div>
        <div class="derecha">
          <BotonPausa />
          {#if practica}
            <button
              type="button"
              class="boton boton--secundario"
              onclick={() => juego.terminarPractica()}
            >
              {textos.terminar}
            </button>
          {:else}
            {#if estado.publicoEnCurso}<span class="chip-pausa">{textos.tiempoEnPausa}</span>{/if}
            <Contador segundos={juego.segundos} alerta={enAlerta} />
          {/if}
        </div>
      </div>
      {#if !practica}
        <BarraTiempo proporcion={juego.segundos / totalSegundos} alerta={enAlerta} />
      {/if}
    </header>

    <div class="fila-flexible">
      <div class="principal">
        {#if !practica}<EscaleraCompacta />{/if}

        <section class="tarjeta enunciado">
          {#if tema}<span class="chip tema">{tema.nombre_corto}</span>{/if}
          <div class="cuerpo">
            {#if pregunta.apoyo}<Apoyo {pregunta} momento="pregunta" />{/if}
            <h2 lang={idioma}>
              {#each trozos as trozo, i (i)}{trozo}{#if i < trozos.length - 1}<span
                    class="hueco"
                    class:revelado={revelada}>{revelada ? rellenoDeHueco(i) : ' '}</span
                  >{/if}{/each}
            </h2>
          </div>
          {#if pregunta.subtitulo}<p class="subtitulo" lang={idioma}>{pregunta.subtitulo}</p>{/if}
        </section>

        <div class="opciones">
          {#each estado.opcionesMostradas as opcion, i (opcion)}
            <Opcion
              letra={LETRAS[i] ?? String(i + 1)}
              texto={opcion}
              estado={estadoDeOpcion(opcion)}
              deshabilitada={estado.fase !== 'pregunta' ||
                estado.publicoEnCurso ||
                estado.opcionesEliminadas.includes(opcion)}
              porcentaje={estado.porcentajesPublico?.[opcion] ?? null}
              esCorrectaParaPrueba={juego.modoPrueba && opcion === pregunta.correcta}
              alElegir={() => juego.responder(opcion)}
            />
          {/each}
        </div>

        {#if !practica}
          <Comodines />
          <Aviso texto={juego.aviso} />
        {/if}
      </div>

      {#if !practica}<Escalera />{/if}
    </div>

    {#if !practica}<Marquesina {frase} />{/if}
  </div>
</section>

<style>
  .barra-juego {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: var(--espacio-4) var(--espacio-5);
  }
  .fila-barra {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--espacio-4);
  }
  .progreso {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 14px;
    min-width: 0;
  }
  .titulo-practica {
    font-size: var(--texto-l);
    font-weight: 700;
    color: var(--acento);
    overflow-wrap: anywhere;
  }
  .numero-pregunta {
    font-size: 14px;
    font-weight: 600;
    color: var(--texto-suave);
  }
  .premio {
    font-size: 28px;
    font-weight: 600;
    color: var(--acento);
  }
  .derecha {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .chip-pausa {
    font-size: var(--texto-s);
    font-weight: 600;
    color: var(--texto);
    background: var(--superficie-2);
    border: 1px solid var(--borde-fuerte);
    border-radius: 999px;
    padding: 5px 12px;
  }

  .principal {
    flex: 999 1 600px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .enunciado {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 28px;
  }
  .tema {
    align-self: flex-start;
  }
  .cuerpo {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--espacio-5);
  }
  h2 {
    flex: 1 1 240px;
    min-width: 0;
    margin: 0;
    font-size: var(--texto-enunciado);
    font-weight: 700;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .subtitulo {
    margin: 0;
    font-size: 14px;
    color: var(--texto-suave);
  }
  .hueco {
    display: inline-block;
    min-width: 3.4em;
    padding: 0 4px;
    border-bottom: 3px solid var(--acento);
    text-align: center;
  }
  .hueco.revelado {
    border-color: var(--correcto);
    color: var(--correcto-texto);
  }

  .opciones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: var(--espacio-3);
  }

  @media (max-width: 560px) {
    .barra-juego {
      padding: 12px 14px;
    }
    .premio {
      font-size: 22px;
    }
    .fila-barra,
    .progreso {
      gap: 10px;
    }
    .derecha {
      gap: 8px;
    }
    .enunciado {
      padding: 18px;
    }
  }
</style>
