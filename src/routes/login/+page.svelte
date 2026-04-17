<script lang="ts">
  import { sendMagicLink } from '$lib/client/auth';

  let email = '';
  let sent = false;
  let error = '';
  let loading = false;

  async function handleSubmit() {
    if (!email.trim()) return;
    loading = true;
    error = '';
    try {
      await sendMagicLink(email.trim());
      sent = true;
    } catch (e) {
      error = 'Something went wrong. Try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-sm mx-auto mt-16">
  {#if sent}
    <p class="text-sm" style="color:var(--color-text)">
      Check your email — a magic link is on its way.
    </p>
  {:else}
    <h1 class="text-xl font-medium mb-6" style="color:var(--color-text)">Sign in</h1>
    <div class="flex gap-2">
      <input
        bind:value={email}
        type="email"
        placeholder="your@email.com"
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
        {loading ? '…' : 'Send link'}
      </button>
    </div>
    {#if error}<p class="text-xs mt-2 text-red-500">{error}</p>{/if}
  {/if}
</div>
