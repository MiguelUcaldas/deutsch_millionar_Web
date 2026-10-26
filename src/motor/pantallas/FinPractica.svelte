<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import { rellenar } from '../textos';

  const juego = obtenerJuego();
  const { textos } = juego;
  const practica = $derived(juego.estado.practica);
</script>

<section class="pantalla" aria-label={textos.practicaTerminada}>
  <div class="centrado">
    <section class="tarjeta fin">
      <div>
        <h1>{textos.practicaTerminada}</h1>
        {#if practica}<p class="titulo">{practica.titulo}</p>{/if}
      </div>
      {#if practica}
        <p class="resumen numeros">
          {rellenar(textos.practicaResumen, {
            aciertos: practica.aciertos,
            respondidas: practica.respondidas,
          })}
        </p>
      {/if}
      <div class="acciones">
        <button
          type="button"
          class="boton boton--principal"
          onclick={() => juego.practicarDeNuevo()}
        >
          {textos.practicarOtraVez}
        </button>
        <button type="button" class="boton boton--secundario" onclick={() => juego.nuevaPartida()}>
          {textos.volverAlInicio}
        </button>
      </div>
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
    font-size: clamp(30px, 5vw, 44px);
    font-weight: 800;
    line-height: 1.1;
    color: var(--acento);
  }
  .titulo {
    margin: 10px 0 0;
    font-size: var(--texto-l);
    color: var(--texto-suave);
  }
  .resumen {
    margin: 0;
    font-size: clamp(26px, 4vw, 34px);
    font-weight: 600;
    color: var(--correcto-texto);
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    gap: var(--espacio-3);
  }
  @media (max-width: 560px) {
    .fin {
      padding-left: 20px;
      padding-right: 20px;
    }
  }
</style>
