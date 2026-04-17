<!-- src/lib/components/post-types/TvCard.svelte -->
<script lang="ts">
  import type { TvData } from '$lib/types/post';
  export let data: TvData;
</script>

<div class="flex gap-4 items-start">
  {#if data.cover_url}
    <a href={data.tmdb_url} target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
      <img src={data.cover_url} alt={data.title} class="w-16 rounded shadow-sm" loading="lazy" />
    </a>
  {/if}
  <div>
    <p class="font-medium leading-snug" style="color:var(--color-text)">{data.title}</p>
    {#if data.season}
      <p class="text-sm mt-0.5" style="color:var(--color-muted)">Season {data.season}</p>
    {/if}
  </div>
</div>
