<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
  export let username: string;
  export let socialLinks: Array<{ label: string; url: string }> = [];
</script>

<footer class="w-full max-w-2xl mx-auto px-4 py-8 mt-12 border-t" style="border-color:var(--color-border)">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm" style="color:var(--color-muted)">
    <span>&copy; {new Date().getFullYear()} {username}</span>
    {#if socialLinks.length}
      <div class="flex gap-4">
        {#each socialLinks as link}
          <a href={link.url} target="_blank" rel="noopener noreferrer" style="color:var(--color-muted)" class="hover:underline">
            {link.label}
          </a>
        {/each}
      </div>
    {/if}
  </div>
</footer>
