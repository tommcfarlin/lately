<!-- src/lib/components/post-types/TweetCard.svelte -->
<script lang="ts">
  import type { TweetData } from '$lib/types/post';
  import { onMount } from 'svelte';

  export let data: TweetData;

  onMount(() => {
    // Load Twitter widgets script to render blockquote embeds
    if (typeof window !== 'undefined' && !document.getElementById('twitter-wjs')) {
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      document.body.appendChild(script);
    } else if ((window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load();
    }
  });
</script>

<div class="w-full overflow-hidden">
  {@html data.oembed_html}
</div>
