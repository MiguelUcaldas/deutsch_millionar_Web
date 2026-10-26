<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { obtenerJuego } from '../estado/juego.svelte';
  import Flecha, { type TrazoFlecha } from './Flecha.svelte';

  interface Props {
    titulo: string;
    columnas: { id: string; texto: string }[];
    filas: { id: string; texto: string; celdas: Record<string, string> }[];
    nota?: string;
    resaltar?: string[];
    /** Par [origen, destino] de ids de celda: el origen se marca punteado y una flecha llega al destino. */
    flecha?: [string, string];
  }

  let { titulo, columnas, filas, nota, resaltar = [], flecha }: Props = $props();
  const juego = obtenerJuego();
  const { idioma } = juego;
  const duracionMs = juego.configuracion.juego.duracionesMs.flechaTabla;

  const idCelda = (fila: string, columna: string) => `${fila}.${columna}`;
  const estaResaltada = (fila: string, columna: string) =>
    resaltar.includes(fila) || resaltar.includes(idCelda(fila, columna));

  const sinMovimiento = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // El destino solo se marca cuando la flecha termina de dibujarse.
  let destinoMarcado = $state(untrack(() => !flecha || sinMovimiento()));
  let trazo = $state<TrazoFlecha | null>(null);
  let lienzo: HTMLElement;

  function medir() {
    if (!flecha) return;
    const origen = lienzo.querySelector<HTMLElement>(`[data-celda="${CSS.escape(flecha[0])}"]`);
    const destino = lienzo.querySelector<HTMLElement>(`[data-celda="${CSS.escape(flecha[1])}"]`);
    if (!origen || !destino) return;
    const base = lienzo.getBoundingClientRect();
    const a = origen.getBoundingClientRect();
    const b = destino.getBoundingClientRect();
    trazo = {
      ancho: base.width,
      alto: base.height,
      origen: { x: a.left - base.left, y: a.top - base.top, ancho: a.width, alto: a.height },
      destino: { x: b.left - base.left, y: b.top - base.top, ancho: b.width, alto: b.height },
    };
  }

  onMount(() => {
    if (!flecha) return;
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(lienzo);

    let espera: ReturnType<typeof setTimeout> | undefined;
    if (!trazo) destinoMarcado = true;
    else if (!destinoMarcado) espera = setTimeout(() => (destinoMarcado = true), duracionMs);
    return () => {
      observador.disconnect();
      clearTimeout(espera);
    };
  });
</script>

<section class="ficha">
  <h3>{titulo}</h3>
  <div class="desplazable">
    <div class="lienzo" bind:this={lienzo}>
      <table>
        <thead>
          <tr>
            <th scope="col"><span class="oculto-visual">{titulo}</span></th>
            {#each columnas as columna (columna.id)}
              <th scope="col">{columna.texto}</th>
            {/each}
          </tr>
        </thead>
        <tbody lang={idioma}>
          {#each filas as fila (fila.id)}
            <tr>
              <th scope="row" class:resaltada={resaltar.includes(fila.id)}>{fila.texto}</th>
              {#each columnas as columna (columna.id)}
                {@const id = idCelda(fila.id, columna.id)}
                {@const valor = fila.celdas[columna.id]}
                {@const esDestino = flecha?.[1] === id}
                {@const resaltada =
                  estaResaltada(fila.id, columna.id) && (!esDestino || destinoMarcado)}
                <td
                  data-celda={id}
                  class:vacia={!valor}
                  class:resaltada
                  class:origen={!resaltada && flecha?.[0] === id}
                >
                  {valor || '—'}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      {#if flecha && trazo}
        <Flecha {trazo} {duracionMs} />
      {/if}
    </div>
  </div>
  {#if nota}<p class="nota">{nota}</p>{/if}
</section>

<style>
  .ficha {
    min-width: 0;
  }
  h3 {
    margin: 6px 0 8px;
    font-size: 20px;
  }
  /* En celular la tabla se desplaza dentro de su tarjeta; la página nunca. */
  .desplazable {
    overflow-x: auto;
    min-width: 0;
  }
  .lienzo {
    position: relative;
    min-width: 520px;
  }
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 6px;
    font-size: 16px;
  }
  thead th {
    text-align: center;
    font-size: var(--texto-s);
    font-weight: 600;
    color: var(--texto-suave);
    padding: 4px 8px;
  }
  tbody th {
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    color: var(--texto-suave);
    padding: 8px;
  }
  tbody th.resaltada {
    color: var(--seleccion-texto);
  }
  td {
    text-align: center;
    padding: 10px;
    border: 1.5px solid transparent;
    border-radius: var(--radio-s);
    background: var(--superficie-2);
    font-family: var(--fuente-mono);
    overflow-wrap: anywhere;
  }
  td.vacia {
    color: var(--texto-tenue);
  }
  td.origen {
    border: 1.5px dashed var(--seleccion);
    color: var(--seleccion-texto);
  }
  td.resaltada {
    border: 1.5px solid var(--seleccion);
    background: var(--seleccion-fondo);
    color: var(--seleccion-texto);
    font-weight: 600;
  }
  .nota {
    margin: 8px 0 0;
    font-size: var(--texto-m);
    font-style: italic;
    color: var(--texto-suave);
  }
</style>
