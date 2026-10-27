<script lang="ts">
  import PildorasDeTema from '../componentes/PildorasDeTema.svelte';
  import Progreso from '../componentes/Progreso.svelte';
  import SeleccionRapida from '../componentes/SeleccionRapida.svelte';
  import { obtenerJuego } from '../estado/juego.svelte';
  import { rellenar } from '../textos';

  const juego = obtenerJuego();
  const { textos, configuracion } = juego;
  const Emblema = configuracion.emblema;

  const temas = $derived(juego.banco?.temas ?? []);
  const alcanza = $derived(juego.alcanzaElMinimo);
</script>

<section class="pantalla" aria-label={configuracion.titulo}>
  <div class="contenedor contenedor--inicio">
    <header class="cabecera">
      <div class="marca">
        {#if Emblema}<Emblema />{/if}
        <div>
          <h1>{configuracion.titulo}</h1>
          <p>{configuracion.descripcion}</p>
        </div>
      </div>
      <button
        type="button"
        class="boton-icono"
        aria-label={juego.apariencia === 'oscuro' ? textos.cambiarAClaro : textos.cambiarAOscuro}
        onclick={() => juego.alternarApariencia()}
      >
        {#if juego.apariencia === 'oscuro'}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
            ><circle cx="12" cy="12" r="4" /><path
              d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            /></svg
          >
        {:else}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg
          >
        {/if}
      </button>
    </header>

    <div class="fila-flexible">
      <div class="tarjeta columna-ancha">
        <h2 class="etiqueta">{textos.comoSeJuega}</h2>
        <ol class="reglas">
          {#each configuracion.reglasInicio as regla, i (i)}
            <li>
              <span class="numero-regla">{i + 1}</span><span class="texto-regla">{regla}</span>
            </li>
          {/each}
        </ol>
      </div>

      <div class="tarjeta columna-angosta panel">
        <div>
          <p class="etiqueta">{textos.preguntasDisponibles}</p>
          <p class="cifra numeros" class:insuficiente={!alcanza}>{juego.disponibles}</p>
        </div>
        <p class="cargadas">
          {rellenar(textos.preguntasCargadas, { n: juego.banco?.preguntas.length ?? 0 })}
        </p>
        {#if !alcanza}
          <p class="aviso-error" role="alert">
            {rellenar(textos.seleccionaMasTemas, { n: juego.disponibles, minimo: juego.minimo })}
          </p>
        {/if}
        <button
          type="button"
          class="boton boton--principal"
          disabled={!alcanza}
          onclick={() => juego.comenzar()}
        >
          {textos.comenzar}
        </button>
        <button type="button" class="boton boton--secundario" onclick={() => juego.irA('repaso')}>
          {textos.repaso}
        </button>
        <p class="atajos">
          {textos.teclado} <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd>
          {textos.tecladoResponden} <kbd>Enter</kbd>
          {textos.tecladoSigue}
        </p>
      </div>
    </div>

    <section class="tarjeta" aria-labelledby="titulo-temas">
      <div class="cabecera-temas">
        <h2 id="titulo-temas">{textos.temasTitulo}</h2>
        <p>
          {rellenar(textos.temasElegidos, { n: juego.temasElegidos.length, total: temas.length })}
        </p>
      </div>
      <SeleccionRapida />
      <div class="rejilla">
        {#each temas as tema (tema.id)}
          <label class="casilla">
            <input
              type="checkbox"
              checked={juego.temasElegidos.includes(tema.id)}
              onchange={(evento) => juego.elegirTema(tema.id, evento.currentTarget.checked)}
            />
            <span class="nombre">{tema.nombre_corto}</span>
            <PildorasDeTema {tema} />
            <span class="cantidad numeros">{juego.preguntasEnTema(tema.id)}</span>
          </label>
        {/each}
      </div>
    </section>

    <Progreso />

    {#if configuracion.repositorio}
      <footer>
        <a href={configuracion.repositorio}>{textos.codigoDelProyecto}</a>
      </footer>
    {/if}
  </div>
</section>

<style>
  .cabecera {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--espacio-4);
  }
  .marca {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  h1 {
    margin: 0;
    font-size: var(--texto-titulo);
    font-weight: 800;
    letter-spacing: 0.04em;
    line-height: 1.1;
  }
  .marca p {
    margin: 6px 0 0;
    color: var(--texto-suave);
  }

  .columna-ancha {
    flex: 999 1 480px;
    min-width: 0;
  }
  .columna-angosta {
    flex: 1 1 300px;
    min-width: 0;
  }
  .reglas {
    margin: 18px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .reglas li {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .numero-regla {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: var(--superficie-2);
    border: 1px solid var(--borde-fuerte);
    color: var(--acento);
    font-family: var(--fuente-mono);
    font-size: var(--texto-s);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .texto-regla {
    min-width: 0;
    font-size: 16px;
    padding-top: 2px;
    overflow-wrap: anywhere;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cifra {
    margin: 8px 0 0;
    font-size: 44px;
    font-weight: 600;
    line-height: 1;
  }
  .cifra.insuficiente {
    color: var(--incorrecto-texto);
  }
  .cargadas {
    margin: 0;
    font-size: 14px;
    color: var(--acento);
  }
  .atajos {
    margin: 0;
    font-size: var(--texto-s);
    color: var(--texto-suave);
    line-height: 1.8;
  }

  .cabecera-temas {
    margin-bottom: 14px;
  }
  .cabecera-temas h2 {
    margin: 0;
    font-size: 20px;
  }
  .cabecera-temas p {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--texto-suave);
  }
  .rejilla {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: 10px;
  }
  .casilla {
    display: flex;
    align-items: center;
    gap: var(--espacio-3);
    min-height: 52px;
    padding: 10px 14px;
    min-width: 0;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie-hundida);
    color: var(--texto-suave);
    cursor: pointer;
  }
  .casilla:has(input:checked) {
    border-color: var(--acento-borde);
    background: var(--superficie-2);
    color: var(--texto);
  }
  .casilla input {
    flex: none;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--acento);
  }
  .nombre {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .cantidad {
    flex: none;
    font-size: var(--texto-xs);
    color: var(--texto-suave);
    background: var(--fondo);
    border-radius: 999px;
    padding: 3px 8px;
  }
  footer {
    font-size: var(--texto-s);
  }
</style>
