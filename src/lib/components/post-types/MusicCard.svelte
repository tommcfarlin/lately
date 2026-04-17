<script lang="ts">
  import type { MusicData } from '$lib/types/post';
  export let data: MusicData;
</script>

<div class="w-full overflow-hidden rounded">
  {#if data.oembed_html}
    {@html data.oembed_html}
  {:else}
    <a href={data.url} target="_blank" rel="noopener noreferrer" style="color:var(--color-accent)" class="underline">
      Listen on {data.service === 'spotify' ? 'Spotify' : 'Apple Music'}
    </a>
  {/if}
</div>
