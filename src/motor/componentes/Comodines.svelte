<script lang="ts">
  import type { Comodin } from '../juego/comodines';
  import { obtenerJuego } from '../estado/juego.svelte';
  import { rellenar } from '../textos';

  const juego = obtenerJuego();
  const { textos } = juego;
  const habilitados = juego.configuracion.juego.comodines;

  const lista: { id: Comodin; accion: () => void }[] = [
    { id: 'cincuentaCincuenta', accion: () => juego.usarCincuenta() },
    { id: 'publico', accion: () => juego.usarPublico() },
    { id: 'cambiar', accion: () => juego.usarCambiar() },
  ];

  // Durante el suspenso, la revelación y las barras del público no se puede usar nada,
  // pero los botones no cambian de aspecto.
  const bloqueados = $derived(juego.estado.fase !== 'pregunta' || juego.estado.publicoEnCurso);
</script>

<div class="comodines">
  {#each lista.filter((c) => habilitados[c.id]) as comodin (comodin.id)}
    {@const usado = juego.estado.comodinesUsados.includes(comodin.id)}
    {@const nombre = textos.comodines[comodin.id]}
    <button
      type="button"
      class="comodin"
      class:usado
      disabled={usado || bloqueados}
      data-comodin={comodin.id}
      onclick={comodin.accion}
    >
      {usado ? rellenar(textos.comodinUsado, { nombre }) : nombre}
    </button>
  {/each}
</div>

<style>
  .comodines {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .comodin {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 48px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--radio-m);
    border: 1.5px solid var(--acento-borde);
    background: var(--superficie-2);
    font-size: var(--texto-m);
    font-weight: 700;
    cursor: pointer;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .comodin:disabled {
    cursor: not-allowed;
  }
  .usado {
    border-style: dashed;
    border-color: var(--borde-fuerte);
    background: transparent;
    color: var(--texto-tenue);
  }
  @media (max-width: 560px) {
    .comodines {
      flex-wrap: nowrap;
    }
    .comodin {
      flex: 1 1 0;
      font-size: 14px;
    }
  }
</style>
