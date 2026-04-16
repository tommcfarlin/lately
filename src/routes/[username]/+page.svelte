<!-- src/routes/[username]/+page.svelte -->
<script lang="ts">
  import Feed from '$lib/components/Feed.svelte';
  import AddPanel from '$lib/components/AddPanel.svelte';

  export let data;
</script>

<svelte:head>
  <title>{data.ogTitle}</title>
  <meta property="og:title" content={data.ogTitle} />
  <meta property="og:url" content={data.ogUrl} />
</svelte:head>

{#if data.isOwner}
  <AddPanel username={data.username} />
{/if}

<Feed
  posts={data.posts}
  page={data.page}
  totalPages={data.totalPages}
  username={data.username}
/>
