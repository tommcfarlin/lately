<!-- src/lib/components/Feed.svelte -->
<script lang="ts">
  import type { Post } from '$lib/types/post';
  import PostCard from './PostCard.svelte';
  import { onMount } from 'svelte';

  export let posts: Post[];
  export let page: number;
  export let totalPages: number;
  export let username: string;
  export let isOwner: boolean = false;

  let isInfiniteScroll = false;
  let allPosts = [...posts];
  let loadingMore = false;
  let currentPage = page;

  onMount(() => {
    isInfiniteScroll = localStorage.getItem('lately-scroll') === 'infinite';

    if (isInfiniteScroll) {
      const observer = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting && !loadingMore && currentPage < totalPages) {
            loadingMore = true;
            currentPage++;
            const res = await fetch(`/${username}?page=${currentPage}`, {
              headers: { 'x-lately-data': '1' }
            });
            // In v1, just navigate to next page — full infinite scroll is phase 2
            loadingMore = false;
          }
        },
        { threshold: 0.1 }
      );

      const sentinel = document.getElementById('scroll-sentinel');
      if (sentinel) observer.observe(sentinel);
      return () => observer.disconnect();
    }
  });
</script>

<div>
  {#each allPosts as post (post.id)}
    <PostCard {post} {isOwner} {username} />
  {/each}

  {#if isInfiniteScroll}
    <div id="scroll-sentinel" class="h-4"></div>
    {#if loadingMore}
      <p class="text-center py-4 text-sm" style="color:var(--color-muted)">Loading…</p>
    {/if}
  {:else}
    <!-- Pagination (also shown as fallback in infinite scroll mode) -->
    {#if totalPages > 1}
      <nav class="flex justify-between items-center pt-8 pb-4 text-sm" style="color:var(--color-muted)">
        {#if page > 1}
          <a href="/{username}?page={page - 1}" class="hover:underline">&larr; Newer</a>
        {:else}
          <span></span>
        {/if}
        <span>{page} / {totalPages}</span>
        {#if page < totalPages}
          <a href="/{username}?page={page + 1}" class="hover:underline">Older &rarr;</a>
        {:else}
          <span></span>
        {/if}
      </nav>
    {/if}
  {/if}
</div>
