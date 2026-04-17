<script lang="ts">
  import type { PostType } from '$lib/types/post';
  import { createEventDispatcher } from 'svelte';

  export let type: PostType;
  const dispatch = createEventDispatcher<{ submit: { value: string } }>();

  let value = '';
  let loading = false;
  let error = '';

  const placeholders: Record<PostType, string> = {
    book: 'Paste Amazon URL, ISBN, or enter title…',
    tv: 'Search by title (e.g. Severance)',
    movie: 'Search by title (e.g. Interstellar)',
    tweet: 'Paste tweet URL…',
    gif: 'Paste Giphy, Tenor, or direct GIF URL…',
    photo: '',
    music: 'Paste Spotify or Apple Music URL…',
    video: 'Paste YouTube URL…'
  };

  async function handleSubmit() {
    if (!value.trim()) return;
    loading = true;
    error = '';
    dispatch('submit', { value: value.trim() });
    loading = false;
  }
</script>

{#if type === 'photo'}
  <input
    type="file"
    accept="image/*"
    class="w-full text-sm"
    style="color:var(--color-text)"
    on:change={(e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) dispatch('submit', { value: URL.createObjectURL(file) });
    }}
  />
{:else}
  <div class="flex gap-2">
    <input
      bind:value
      type="text"
      placeholder={placeholders[type]}
      class="flex-1 px-3 py-2 rounded border text-sm outline-none"
      style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
      on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
    />
    <button
      on:click={handleSubmit}
      disabled={loading}
      class="px-4 py-2 rounded text-sm font-medium"
      style="background:var(--color-accent);color:var(--color-bg)"
    >
      {loading ? '…' : 'Fetch'}
    </button>
  </div>
  {#if error}<p class="text-xs mt-1 text-red-500">{error}</p>{/if}
{/if}
