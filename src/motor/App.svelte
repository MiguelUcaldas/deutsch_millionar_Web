<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fuentesDelTemario } from './contenido/desdeTemario';
  import temario from '@temario';
  import Depuracion from './componentes/Depuracion.svelte';
  import { crearJuego, proveerJuego } from './estado/juego.svelte';
  import Derrota from './pantallas/Derrota.svelte';
  import ErrorDatos from './pantallas/ErrorDatos.svelte';
  import FinPractica from './pantallas/FinPractica.svelte';
  import Inicio from './pantallas/Inicio.svelte';
  import Pregunta from './pantallas/Pregunta.svelte';
  import Repaso from './pantallas/Repaso.svelte';
  import Resultado from './pantallas/Resultado.svelte';
  import Victoria from './pantallas/Victoria.svelte';

  const modoPrueba = import.meta.env.MODE === 'test';
  const parametros = new URLSearchParams(location.search);
  const semilla =
    modoPrueba && parametros.has('semilla') ? Number(parametros.get('semilla')) : undefined;

  const juego = crearJuego({
    configuracion: temario,
    fuentes: fuentesDelTemario(),
    modoPrueba,
    semilla,
    debug: parametros.has('debug'),
    forzarError: modoPrueba && parametros.has('error'),
  });
  proveerJuego(juego);
  onDestroy(() => juego.destruir());

  $effect(() => {
    document.title = temario.titulo;
  });

  const LETRAS = ['a', 'b', 'c', 'd'];

  function alTeclear(evento: KeyboardEvent) {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    // Con un modal abierto (tema, escalera) el teclado es del modal.
    if (document.querySelector('[role="dialog"]')) return;
    const objetivo = evento.target as HTMLElement | null;
    const enCampo = objetivo?.closest('input, textarea, select');
    if (enCampo) return;

    const tecla = evento.key.toLowerCase();
    if (juego.pantalla === 'pregunta') {
      const indice = LETRAS.indexOf(tecla);
      const estado = juego.estado;
      const opcion = indice >= 0 ? estado.opcionesMostradas[indice] : undefined;
      // Solo responden las opciones visibles y habilitadas (corrige el error del 50:50).
      if (
        opcion !== undefined &&
        estado.fase === 'pregunta' &&
        !estado.publicoEnCurso &&
        !estado.opcionesEliminadas.includes(opcion)
      ) {
        evento.preventDefault();
        juego.responder(opcion);
      }
    } else if (juego.pantalla === 'resultado' && evento.key === 'Enter') {
      // Si el foco está en un botón, Enter ya lo activa por sí solo.
      if (objetivo?.closest('button, a')) return;
      evento.preventDefault();
      juego.siguiente();
    }
  }
</script>

<svelte:window onkeydown={alTeclear} />

<main>
  {#if juego.pantalla === 'error'}
    <ErrorDatos />
  {:else if juego.pantalla === 'inicio'}
    <Inicio />
  {:else if juego.pantalla === 'repaso'}
    <Repaso />
  {:else if juego.pantalla === 'pregunta'}
    <Pregunta />
  {:else if juego.pantalla === 'resultado'}
    <Resultado />
  {:else if juego.pantalla === 'victoria'}
    <Victoria />
  {:else if juego.pantalla === 'derrota'}
    <Derrota />
  {:else if juego.pantalla === 'finPractica'}
    <FinPractica />
  {/if}
</main>

{#if juego.debug}<Depuracion />{/if}
