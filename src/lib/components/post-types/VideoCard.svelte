<script lang="ts">
  import type { VideoData } from '$lib/types/post';
  export let data: VideoData;
</script>

<div class="w-full aspect-video overflow-hidden rounded">
  {@html data.oembed_html}
</div>
