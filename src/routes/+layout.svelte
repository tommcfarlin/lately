<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Toggles from '$lib/components/Toggles.svelte';

  export let data;
</script>

<div class="min-h-screen flex flex-col" style="background:var(--color-bg);color:var(--color-text)">
  <Toggles />
  <Header siteTitle={data.siteTitle} subtitle={data.subtitle} />
  <main class="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
    <slot />
  </main>
  <Footer
    username={data.username}
    socialLinks={data.socialLinks}
  />
</div>
