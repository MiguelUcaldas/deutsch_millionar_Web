<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import { rellenar } from '../textos';

  export type EstadoOpcion =
    | 'normal'
    | 'elegida'
    | 'suspenso'
    | 'suspensoFijo'
    | 'correcta'
    | 'incorrecta'
    | 'apagada'
    | 'eliminada';

  interface Props {
    letra: string;
    texto: string;
    estado: EstadoOpcion;
    deshabilitada: boolean;
    /** Porcentaje del público; null mientras no se usó el comodín. */
    porcentaje: number | null;
    /** Solo en pruebas: marca cuál es la correcta con un atributo `data-`. */
    esCorrectaParaPrueba?: boolean;
    alElegir: () => void;
  }

  let { letra, texto, estado, deshabilitada, porcentaje, esCorrectaParaPrueba, alElegir }: Props =
    $props();
  const { textos, idioma } = obtenerJuego();

  const marca = $derived(
    estado === 'elegida' || estado === 'suspenso' || estado === 'suspensoFijo'
      ? textos.tuRespuesta
      : estado === 'correcta'
        ? `✓ ${textos.correcta}`
        : estado === 'incorrecta'
          ? `✗ ${textos.tuRespuesta}`
          : '',
  );
</script>

<button
  type="button"
  class="opcion {estado}"
  disabled={deshabilitada}
  aria-label={estado === 'eliminada'
    ? rellenar(textos.opcionEliminada, { letra })
    : `${letra}: ${texto}`}
  data-opcion={letra}
  data-correcta={esCorrectaParaPrueba ? 'true' : undefined}
  onclick={alElegir}
>
  <span class="fila">
    <span class="letra">{letra}</span>
    <span class="texto" lang={idioma}>{estado === 'eliminada' ? '' : texto}</span>
    <span class="marca">{marca}</span>
  </span>
  {#if porcentaje !== null}
    <span class="publico">
      <span class="pista"><span class="barra" style:--ancho="{porcentaje}%"></span></span>
      <span class="valor numeros">{porcentaje}%</span>
    </span>
  {/if}
</button>

<style>
  .opcion {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 68px;
    padding: 14px 16px;
    min-width: 0;
    text-align: left;
    border-radius: 14px;
    border: 1.5px solid var(--borde);
    background: var(--superficie);
    color: var(--texto);
    cursor: pointer;
    transition:
      border-color 0.15s,
      background-color 0.15s,
      opacity 0.2s;
  }
  .opcion:hover:not(:disabled) {
    border-color: var(--acento-borde);
    background: var(--superficie-2);
  }
  .opcion:disabled {
    cursor: default;
  }
  .fila {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-width: 0;
  }
  .letra {
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--superficie-2);
    color: var(--acento);
    font-family: var(--fuente-mono);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .texto {
    flex: 1;
    min-width: 0;
    font-size: var(--texto-opcion);
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .marca {
    flex: none;
    max-width: 40%;
    font-size: var(--texto-s);
    font-weight: 700;
    text-align: right;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  .publico {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  .pista {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: var(--fondo);
    overflow: hidden;
  }
  .barra {
    display: block;
    height: 100%;
    width: var(--ancho);
    border-radius: 999px;
    background: var(--publico);
    /* Crece desde cero en lo que dura el comodín; es una animación para poder pausarla. */
    animation: crecer var(--duracion-publico, 2s) ease-out;
  }
  .valor {
    flex: none;
    width: 44px;
    text-align: right;
    font-size: var(--texto-s);
    color: var(--texto);
  }

  .elegida,
  .suspenso,
  .suspensoFijo {
    border-color: var(--seleccion);
    background: var(--seleccion-fondo);
  }
  .elegida .letra,
  .suspenso .letra,
  .suspensoFijo .letra {
    background: var(--seleccion);
    color: var(--sobre-acento);
  }
  .elegida .marca,
  .suspenso .marca,
  .suspensoFijo .marca {
    color: var(--seleccion-texto);
  }
  /* Parpadea solo mientras suena el suspenso; en el silencio final queda fija (.suspensoFijo).
     La cantidad y la duración de los ciclos las calcula Pregunta.svelte desde la configuración. */
  .suspenso {
    animation: parpadeo var(--ciclo-parpadeo) steps(2, jump-none) var(--parpadeos);
  }
  .correcta {
    border-color: var(--correcto);
    background: var(--correcto-fondo);
  }
  .correcta .letra {
    background: var(--correcto);
    color: var(--sobre-correcto);
  }
  .correcta .marca {
    color: var(--correcto-texto);
  }
  .incorrecta {
    border-color: var(--incorrecto);
    background: var(--incorrecto-fondo);
  }
  .incorrecta .letra {
    background: var(--incorrecto);
    color: var(--sobre-incorrecto);
  }
  .incorrecta .marca {
    color: var(--incorrecto-texto);
  }
  .apagada {
    opacity: 0.55;
  }
  .eliminada {
    border-style: dashed;
    border-color: var(--borde-fuerte);
    background: transparent;
    opacity: 0.5;
  }
  .eliminada .letra {
    background: transparent;
    color: var(--texto-tenue);
  }

  @media (max-width: 560px) {
    .opcion {
      min-height: 56px;
      padding: 10px 14px;
    }
  }
</style>
