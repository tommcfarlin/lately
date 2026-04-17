<script lang="ts">
  import type { PostType } from '$lib/types/post';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ select: PostType }>();

  const types: Array<{ type: PostType; label: string; emoji: string }> = [
    { type: 'book', label: 'Book', emoji: '📚' },
    { type: 'tv', label: 'TV Show', emoji: '📺' },
    { type: 'movie', label: 'Movie', emoji: '🎬' },
    { type: 'tweet', label: 'Tweet', emoji: '🐦' },
    { type: 'gif', label: 'GIF', emoji: '🎭' },
    { type: 'photo', label: 'Photo', emoji: '📷' },
    { type: 'music', label: 'Music', emoji: '🎵' },
    { type: 'video', label: 'Video', emoji: '▶️' }
  ];
</script>

<div class="grid grid-cols-4 gap-2">
  {#each types as t}
    <button
      on:click={() => dispatch('select', t.type)}
      class="flex flex-col items-center p-3 rounded-lg border text-sm gap-1 hover:opacity-70 transition-opacity"
      style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
    >
      <span class="text-xl">{t.emoji}</span>
      <span>{t.label}</span>
    </button>
  {/each}
</div>
