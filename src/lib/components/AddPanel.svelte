<script lang="ts">
  import type { PostType, PostData } from '$lib/types/post';
  import TypePicker from './add-steps/TypePicker.svelte';
  import UrlInput from './add-steps/UrlInput.svelte';
  import MetadataPreview from './add-steps/MetadataPreview.svelte';
  import CaptionInput from './add-steps/CaptionInput.svelte';

  export let username: string;

  type Step = 'closed' | 'pick-type' | 'input' | 'preview' | 'caption';

  let step: Step = 'closed';
  let selectedType: PostType | null = null;
  let fetchedData: PostData | null = null;
  let photoFile: File | null = null;

  function open() { step = 'pick-type'; }
  function close() { step = 'closed'; selectedType = null; fetchedData = null; }

  async function handleTypeSelect(e: CustomEvent<PostType>) {
    selectedType = e.detail;
    step = 'input';
  }

  async function handleUrlSubmit(e: CustomEvent<{ value: string }>) {
    if (!selectedType) return;

    if (selectedType === 'photo') {
      step = 'caption';
      return;
    }

    const res = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildMetadataPayload(selectedType, e.detail.value))
    });

    if (!res.ok) {
      alert('Could not fetch metadata. Check the URL and try again.');
      return;
    }

    const json = await res.json();
    fetchedData = json.data ?? json.results?.[0];
    step = 'preview';
  }

  function buildMetadataPayload(type: PostType, value: string) {
    if (type === 'tv' || type === 'movie') return { type, query: value };
    if (type === 'book') {
      const isIsbn = /^[0-9]{10,13}$/.test(value.replace(/-/g, ''));
      if (isIsbn) return { isbn: value };
      return { type: 'book', query: value };
    }
    return { url: value };
  }

  async function handleConfirm() {
    step = 'caption';
  }

  async function handleCaption(e: CustomEvent<{ caption: string }>) {
    if (!selectedType || !fetchedData) return;

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: selectedType,
        caption: e.detail.caption || null,
        is_private: false,
        data: fetchedData
      })
    });

    close();
    window.location.reload();
  }
</script>

{#if step === 'closed'}
  <button
    on:click={open}
    class="fixed bottom-6 right-6 w-12 h-12 rounded-full text-2xl shadow-lg flex items-center justify-center z-50"
    style="background:var(--color-accent);color:var(--color-bg)"
    aria-label="Add post"
  >
    +
  </button>
{:else}
  <div
    class="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
    style="background:rgba(0,0,0,0.4)"
    on:click|self={close}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      style="background:var(--color-bg)"
    >
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-medium" style="color:var(--color-text)">
          {#if step === 'pick-type'}Add something{/if}
          {#if step === 'input' && selectedType}Add {selectedType}{/if}
          {#if step === 'preview'}Preview{/if}
          {#if step === 'caption'}Add a caption{/if}
        </h2>
        <button on:click={close} class="text-sm" style="color:var(--color-muted)">✕</button>
      </div>

      {#if step === 'pick-type'}
        <TypePicker on:select={handleTypeSelect} />
      {:else if step === 'input' && selectedType}
        <UrlInput type={selectedType} on:submit={handleUrlSubmit} />
      {:else if step === 'preview' && selectedType && fetchedData}
        <MetadataPreview type={selectedType} data={fetchedData} on:confirm={handleConfirm} on:back={() => (step = 'input')} />
      {:else if step === 'caption'}
        <CaptionInput on:submit={handleCaption} />
      {/if}
    </div>
  </div>
{/if}
