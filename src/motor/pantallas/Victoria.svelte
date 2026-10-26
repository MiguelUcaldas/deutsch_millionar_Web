<script lang="ts">
  import Celebracion from '../componentes/Celebracion.svelte';
  import { obtenerJuego } from '../estado/juego.svelte';
  import { premioObtenido } from '../juego/maquina';
  import { formatearDinero } from '../juego/premios';

  const juego = obtenerJuego();
  const { textos, idioma, configuracion } = juego;
</script>

<section class="pantalla" aria-label={textos.victoria}>
  <div class="centrado">
    <section class="tarjeta victoria">
      <Celebracion />
      <h1 lang={idioma}>{textos.victoria}</h1>
      <p class="premio numeros">
        {formatearDinero(configuracion.moneda, premioObtenido(juego.estado, configuracion.juego))}
      </p>
      <button type="button" class="boton boton--principal" onclick={() => juego.nuevaPartida()}>
        {textos.nuevaPartida}
      </button>
    </section>
  </div>
</section>

<style>
  .victoria {
    position: relative;
    overflow: hidden;
    width: 100%;
    max-width: 640px;
    border-color: var(--acento-borde);
    border-radius: var(--radio-xl);
    padding: 72px 32px 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: clamp(28px, 4.5vw, 40px);
    font-weight: 800;
    line-height: 1.2;
    color: var(--acento);
  }
  .premio {
    margin: 0;
    font-size: clamp(40px, 7vw, 60px);
    font-weight: 600;
    line-height: 1.1;
    color: var(--correcto-texto);
    overflow-wrap: anywhere;
  }
  .boton {
    min-width: 220px;
    margin-top: 8px;
  }
  @media (max-width: 560px) {
    .victoria {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
</style>
