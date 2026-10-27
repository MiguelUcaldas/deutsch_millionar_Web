<script lang="ts">
  import { obtenerJuego } from '../estado/juego.svelte';
  import { formatearDinero, proximaSegura } from '../juego/premios';
  import { rellenar } from '../textos';
  import ListaEscalera from './ListaEscalera.svelte';
  import Modal from './Modal.svelte';

  const juego = obtenerJuego();
  const { textos } = juego;

  let abierta = $state(false);
  const proxima = $derived(proximaSegura(juego.configuracion.juego, juego.estado.numeroPregunta));
</script>

<div class="compacta">
  <span class="resumen">
    {textos.asegurado}
    <strong>{formatearDinero(juego.configuracion.moneda, juego.estado.premioAsegurado)}</strong>
    {#if proxima !== null}· {rellenar(textos.proximoSeguro, { n: proxima })}{/if}
  </span>
  <button type="button" class="abrir" onclick={() => (abierta = true)}>
    {textos.escalera}
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg
    >
  </button>
</div>

{#if abierta}
  <Modal titulo={textos.escaleraTitulo} variante="hoja" alCerrar={() => (abierta = false)}>
    <ListaEscalera />
  </Modal>
{/if}

<style>
  .compacta {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 0 4px 0 14px;
    border-radius: var(--radio-m);
    border: 1px solid var(--borde);
    background: var(--superficie-hundida);
    font-size: var(--texto-s);
    color: var(--texto-suave);
  }
  .resumen {
    min-width: 0;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  strong {
    font-family: var(--fuente-mono);
    color: var(--acento);
  }
  .abrir {
    flex: none;
    min-height: 40px;
    padding: 0 12px;
    border: none;
    background: transparent;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  @media (max-width: 900px) {
    .compacta {
      display: flex;
    }
  }
</style>
