<script lang="ts">
  let { texto }: { texto: string | null } = $props();
</script>

<!-- La zona existe siempre (reserva su altura) para que nada salte cuando aparece el aviso. -->
<div class="zona" role="status">
  {#if texto}
    <p class="aviso">{texto}</p>
  {/if}
</div>

<style>
  .zona {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .aviso {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--seleccion-texto);
    background: var(--seleccion-fondo);
    border: 1px solid color-mix(in srgb, var(--seleccion) 45%, transparent);
    border-radius: 10px;
    padding: 9px 14px;
    overflow-wrap: anywhere;
  }
</style>
