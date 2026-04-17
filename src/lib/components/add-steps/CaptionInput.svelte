<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ submit: { caption: string } }>();

  let caption = '';
  let loading = false;

  function handleSubmit() {
    loading = true;
    dispatch('submit', { caption });
  }
</script>

<div>
  <textarea
    bind:value={caption}
    placeholder="Add a caption (optional)…"
    rows="3"
    class="w-full px-3 py-2 rounded border text-sm resize-none outline-none"
    style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
  ></textarea>
  <div class="flex gap-2 mt-3">
    <button
      on:click={handleSubmit}
      disabled={loading}
      class="px-4 py-2 rounded text-sm font-medium"
      style="background:var(--color-accent);color:var(--color-bg)"
    >
      {loading ? 'Posting…' : 'Post'}
    </button>
    <button
      on:click={handleSubmit}
      class="px-4 py-2 rounded text-sm border"
      style="border-color:var(--color-border);color:var(--color-muted)"
    >
      Post without caption
    </button>
  </div>
</div>
