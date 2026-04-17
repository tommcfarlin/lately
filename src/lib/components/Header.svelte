<!-- src/lib/components/Header.svelte -->
<script lang="ts">
  export let siteTitle: string;
  export let subtitle: string;
</script>

<header class="w-full max-w-2xl mx-auto px-4 pt-12 pb-6">
  <h1 class="text-2xl font-semibold tracking-tight" style="color:var(--color-text)">
    {siteTitle}
  </h1>
  {#if subtitle}
    <p class="mt-1 text-sm" style="color:var(--color-muted)">{subtitle}</p>
  {/if}
</header>
