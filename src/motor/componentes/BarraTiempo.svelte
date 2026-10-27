<script lang="ts">
  let { proporcion, alerta }: { proporcion: number; alerta: boolean } = $props();
  const porcentaje = $derived(Math.max(0, Math.min(1, proporcion)) * 100);
</script>

<div class="barra" aria-hidden="true">
  <div class="relleno" class:alerta style:width="{porcentaje}%"></div>
</div>

<style>
  .barra {
    height: 6px;
    border-radius: 999px;
    background: var(--fondo);
    overflow: hidden;
  }
  .relleno {
    height: 100%;
    border-radius: 999px;
    background: var(--acento);
    /* Sin transición: la barra baja en el mismo cuadro en que cambia el número y suena el tic. */
  }
  .relleno.alerta {
    background: var(--incorrecto);
  }
</style>
