<script lang="ts">
  let { frase }: { frase: string } = $props();

  // El texto se repite un número par de veces: la animación recorre justo la mitad y vuelve a empezar.
  const repetido = $derived(Array.from({ length: 16 }, () => frase).join('   ·   ') + '   ·   ');
</script>

<div class="marquesina" aria-hidden="true">
  <span class="pista">{repetido}</span>
</div>

<style>
  .marquesina {
    overflow: hidden;
    white-space: nowrap;
    border-top: 1px solid var(--borde);
    padding: 14px 4px 0;
    color: var(--marquesina);
    font-size: var(--texto-m);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .pista {
    display: inline-block;
    animation: desplazar 22s linear infinite;
  }
</style>
