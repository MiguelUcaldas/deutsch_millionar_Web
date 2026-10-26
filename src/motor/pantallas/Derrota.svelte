<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import { premioObtenido } from '../juego/maquina';
  import { formatearDinero } from '../juego/premios';

  const juego = obtenerJuego();
  const { textos, idioma, configuracion } = juego;
  const estado = $derived(juego.estado);
  const motivo = $derived(
    estado.motivoFin === 'tiempo' ? textos.tiempoAgotado : textos.derrotaIncorrecta,
  );
</script>

<section class="pantalla" aria-label={textos.derrotaTitulo}>
  <div class="centrado">
    <section class="tarjeta fin">
      <div>
        <h1>{textos.derrotaTitulo}</h1>
        <p class="motivo">{motivo}</p>
      </div>
      <p class="correcta-era">
        {textos.respuestaCorrectaEra}
        <strong lang={idioma}>{estado.preguntaActual?.correcta}</strong>
      </p>
      <div class="datos">
        <div class="dato">
          <span class="nombre">{textos.llegasteHasta}</span>
          <span class="valor numeros">{estado.numeroPregunta}</span>
        </div>
        <div class="dato">
          <span class="nombre">{textos.premioObtenido}</span>
          <span class="valor premio numeros">
            {formatearDinero(configuracion.moneda, premioObtenido(estado, configuracion.juego))}
          </span>
        </div>
      </div>
      <button type="button" class="boton boton--principal" onclick={() => juego.nuevaPartida()}>
        {textos.nuevaPartida}
      </button>
    </section>
  </div>
</section>

<style>
  .fin {
    width: 100%;
    max-width: 600px;
    border-radius: var(--radio-xl);
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  h1 {
    margin: 0;
    font-size: clamp(36px, 6vw, 52px);
    font-weight: 800;
    line-height: 1.05;
    color: var(--titulo-fallo);
  }
  .motivo {
    margin: 10px 0 0;
    font-size: var(--texto-l);
    color: var(--texto-suave);
  }
  .correcta-era {
    margin: 0;
    font-size: var(--texto-l);
    padding: 12px 16px;
    border-radius: var(--radio-m);
    background: var(--correcto-fondo);
    border: 1px solid color-mix(in srgb, var(--correcto) 45%, transparent);
    overflow-wrap: anywhere;
  }
  .correcta-era strong {
    color: var(--correcto-texto);
  }
  .datos {
    display: flex;
    flex-wrap: wrap;
    gap: var(--espacio-3);
  }
  .dato {
    flex: 1 1 200px;
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
    font-size: 30px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .premio {
    color: var(--acento);
  }
  @media (max-width: 560px) {
    .fin {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
</style>
