<!-- src/lib/components/Toggles.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let isDark = false;
  let isInfiniteScroll = false;

  onMount(() => {
    isDark = localStorage.getItem('lately-theme') === 'dark';
    isInfiniteScroll = localStorage.getItem('lately-scroll') === 'infinite';
  });

  function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem('lately-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }

  function toggleScroll() {
    isInfiniteScroll = !isInfiniteScroll;
    localStorage.setItem('lately-scroll', isInfiniteScroll ? 'infinite' : 'paginated');
    // Reload to apply scroll mode change
    window.location.reload();
  }
</script>

<div class="fixed top-4 right-4 flex gap-2 z-50">
  <button
    on:click={toggleTheme}
    class="w-8 h-8 rounded-full flex items-center justify-center text-sm border"
    style="background:var(--color-bg);border-color:var(--color-border);color:var(--color-text)"
    aria-label="Toggle dark mode"
    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {isDark ? '☀️' : '🌙'}
  </button>

  <button
    on:click={toggleScroll}
    class="w-8 h-8 rounded-full flex items-center justify-center text-sm border"
    style="background:var(--color-bg);border-color:var(--color-border);color:var(--color-text)"
    aria-label="Toggle scroll mode"
    title={isInfiniteScroll ? 'Switch to pagination' : 'Switch to infinite scroll'}
  >
    {isInfiniteScroll ? '📄' : '∞'}
  </button>
</div>
