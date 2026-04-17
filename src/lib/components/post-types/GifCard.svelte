<!-- src/lib/components/post-types/GifCard.svelte -->
<script lang="ts">
  import type { GifData } from '$lib/types/post';
  export let data: GifData;
</script>

<div class="w-full">
  {#if data.source === 'direct'}
    <img src={data.gif_url} alt="GIF" class="w-full rounded" loading="lazy" />
  {:else if data.oembed_html}
    <div class="w-full overflow-hidden rounded">
      {@html data.oembed_html}
    </div>
  {:else}
    <img src={data.gif_url} alt="GIF" class="w-full rounded" loading="lazy" />
  {/if}
</div>
