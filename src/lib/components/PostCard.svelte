<!-- src/lib/components/PostCard.svelte -->
<script lang="ts">
  import type { Post } from '$lib/types/post';
  import { getPostLabel } from '$lib/utils/labels';
  import { formatPostDate, formatPostTime } from '$lib/utils/date';
  import BookCard from './post-types/BookCard.svelte';
  import TvCard from './post-types/TvCard.svelte';
  import MovieCard from './post-types/MovieCard.svelte';
  import TweetCard from './post-types/TweetCard.svelte';
  import GifCard from './post-types/GifCard.svelte';
  import PhotoCard from './post-types/PhotoCard.svelte';
  import MusicCard from './post-types/MusicCard.svelte';
  import VideoCard from './post-types/VideoCard.svelte';

  export let post: Post;
  export let isOwner: boolean = false;
  export let username: string = '';

  const components = {
    book: BookCard,
    tv: TvCard,
    movie: MovieCard,
    tweet: TweetCard,
    gif: GifCard,
    photo: PhotoCard,
    music: MusicCard,
    video: VideoCard
  };

  $: component = components[post.type];
  $: label = getPostLabel(post.type);

  async function togglePrivate() {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, is_private: !post.is_private })
    });
    window.location.reload();
  }

  async function deletePost() {
    if (!confirm('Delete this post?')) return;
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id })
    });
    window.location.reload();
  }
</script>

<article class="py-6 border-b" style="border-color:var(--color-border)">
  <div class="flex items-center justify-between mb-3">
    <span class="text-xs font-medium uppercase tracking-wider" style="color:var(--color-muted)">
      {label}
      {#if post.is_private}
        <span class="ml-1 opacity-50">(private)</span>
      {/if}
    </span>
    <div class="flex items-center gap-3">
      <a
        href="/{username}/{post.id}"
        class="text-xs"
        style="color:var(--color-muted)"
        title="{formatPostDate(post.created_at)} at {formatPostTime(post.created_at)}"
      >
        {formatPostDate(post.created_at)}
      </a>
      {#if isOwner}
        <button on:click={togglePrivate} class="text-xs" style="color:var(--color-muted)" title={post.is_private ? 'Make public' : 'Make private'}>
          {post.is_private ? '👁' : '🔒'}
        </button>
        <button on:click={deletePost} class="text-xs" style="color:var(--color-muted)" title="Delete post">
          ✕
        </button>
      {/if}
    </div>
  </div>

  <svelte:component this={component} data={post.data} />

  {#if post.caption}
    <p class="mt-3 text-sm leading-relaxed" style="color:var(--color-text)">{post.caption}</p>
  {/if}
</article>
