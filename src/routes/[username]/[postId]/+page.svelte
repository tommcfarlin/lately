<!-- src/routes/[username]/[postId]/+page.svelte -->
<script lang="ts">
  import PostCard from '$lib/components/PostCard.svelte';

  export let data;
</script>

<svelte:head>
  <title>{data.ogTitle}</title>
  <meta property="og:title" content={data.ogTitle} />
  <meta property="og:url" content={data.ogUrl} />
</svelte:head>

<div class="mt-8">
  <a
    href="/{data.post.user_id}"
    class="text-sm mb-6 inline-block"
    style="color:var(--color-muted)"
  >
    &larr; Back to feed
  </a>
  <PostCard post={data.post} isOwner={data.isOwner} />
</div>
