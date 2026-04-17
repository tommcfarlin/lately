<script lang="ts">
  import type { PostType, PostData } from '$lib/types/post';
  import PostCard from '$lib/components/PostCard.svelte';
  import { createEventDispatcher } from 'svelte';

  export let type: PostType;
  export let data: PostData;
  const dispatch = createEventDispatcher<{ confirm: void; back: void }>();

  // Synthesise a fake post for preview
  $: previewPost = {
    id: 'preview',
    user_id: '',
    type,
    caption: null,
    is_private: false,
    created_at: new Date().toISOString(),
    data
  };
</script>

<div>
  <p class="text-sm mb-3" style="color:var(--color-muted)">Looks right?</p>
  <PostCard post={previewPost} isOwner={false} username="" />
  <div class="flex gap-2 mt-4">
    <button
      on:click={() => dispatch('back')}
      class="px-4 py-2 rounded text-sm border"
      style="border-color:var(--color-border);color:var(--color-text)"
    >
      Back
    </button>
    <button
      on:click={() => dispatch('confirm')}
      class="px-4 py-2 rounded text-sm font-medium"
      style="background:var(--color-accent);color:var(--color-bg)"
    >
      Confirm
    </button>
  </div>
</div>
