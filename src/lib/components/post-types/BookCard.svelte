<!-- src/lib/components/post-types/BookCard.svelte -->
<script lang="ts">
  import type { BookData } from '$lib/types/post';
  export let data: BookData;
</script>

<div class="flex gap-4 items-start">
  {#if data.cover_url}
    <a href={data.source_url ?? '#'} target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
      <img src={data.cover_url} alt={data.title} class="w-16 rounded shadow-sm" loading="lazy" />
    </a>
  {/if}
  <div>
    <p class="font-medium leading-snug" style="color:var(--color-text)">{data.title}</p>
    <p class="text-sm mt-0.5" style="color:var(--color-muted)">{data.author}</p>
  </div>
</div>
