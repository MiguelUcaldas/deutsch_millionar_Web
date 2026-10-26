<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import { esPreguntaSegura, formatearDinero } from '../juego/premios';

  const juego = obtenerJuego();
  const { textos } = juego;
  const { premios } = juego.configuracion.juego;
  const actual = $derived(juego.estado.numeroPregunta);

  // De la última pregunta (arriba) a la primera (abajo).
  const filas = premios.map((premio, i) => ({ numero: i + 1, premio })).reverse();
</script>

<ol>
  {#each filas as fila (fila.numero)}
    {@const segura = esPreguntaSegura(juego.configuracion.juego, fila.numero)}
    <li
      class="fila"
      class:pasada={fila.numero < actual}
      class:segura
      class:actual={fila.numero === actual}
      aria-current={fila.numero === actual ? 'step' : undefined}
    >
      <span class="numero">{fila.numero}</span>
      <span class="premio">{formatearDinero(juego.configuracion.moneda, fila.premio)}</span>
      <span class="seguro" aria-label={segura ? textos.premioAsegurado : undefined}
        >{segura ? '◆' : ''}</span
      >
    </li>
  {/each}
</ol>
<p class="leyenda"><span class="rombo">◆</span> {textos.premioAsegurado}</p>

<style>
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .fila {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 30px;
    padding: 4px 10px;
    border-radius: var(--radio-s);
    border: 1px solid transparent;
    font-family: var(--fuente-mono);
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  .numero {
    flex: none;
    width: 22px;
    text-align: right;
  }
  .premio {
    flex: 1;
    min-width: 0;
    text-align: right;
  }
  .seguro {
    flex: none;
    width: 14px;
    text-align: center;
    font-size: 11px;
    color: var(--acento);
  }
  .pasada {
    color: var(--texto-tenue);
  }
  .segura {
    color: var(--acento);
    font-weight: 700;
  }
  .actual {
    color: var(--seleccion-texto);
    font-weight: 700;
    background: var(--seleccion-fondo);
    border-color: var(--seleccion);
  }
  .leyenda {
    margin: 12px 6px 2px;
    font-size: var(--texto-xs);
    color: var(--texto-suave);
  }
  .rombo {
    color: var(--acento);
  }
</style>
