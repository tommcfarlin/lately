<script lang="ts">
  import type { PhotoData } from '$lib/types/post';
  export let data: PhotoData;
</script>

<div class="w-full">
  <img
    src={data.public_url}
    alt="Photo"
    class="w-full rounded"
    loading="lazy"
  />
</div>
