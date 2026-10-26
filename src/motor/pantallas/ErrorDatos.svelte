<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;
  const error = $derived(juego.mensajeError);

  const detalle = $derived(
    [
      error?.archivo,
      error?.linea !== undefined
        ? `Línea ${error.linea}, columna ${error.columna ?? '?'}`
        : undefined,
      error?.mensaje,
    ]
      .filter(Boolean)
      .join('\n'),
  );
</script>

<section class="pantalla" aria-label={textos.errorDatosTitulo}>
  <div class="centrado">
    <section class="tarjeta error" role="alert">
      <h1>{textos.errorDatosTitulo}</h1>
      <pre class="detalle">{detalle}</pre>
      <p class="ayuda">{textos.errorDatosAyuda}</p>
      <button type="button" class="boton boton--principal" onclick={() => juego.reintentar()}>
        {textos.reintentar}
      </button>
    </section>
  </div>
</section>

<style>
  .error {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: var(--espacio-4);
  }
  h1 {
    margin: 0;
    font-size: 28px;
    color: var(--titulo-fallo);
  }
  .detalle {
    margin: 0;
    padding: 14px 16px;
    border-radius: var(--radio-m);
    background: var(--superficie-hundida);
    border: 1px solid var(--borde);
    font-family: var(--fuente-mono);
    font-size: 14px;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .ayuda {
    margin: 0;
    color: var(--texto-suave);
  }
  .boton {
    align-self: flex-start;
  }
</style>
