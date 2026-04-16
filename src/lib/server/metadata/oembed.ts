// src/lib/server/metadata/oembed.ts
import type { PostType } from '$lib/types/post';

const OEMBED_ENDPOINTS: Partial<Record<PostType, string>> = {
  tweet: 'https://publish.twitter.com/oembed',
  music: 'https://open.spotify.com/oembed',
  video: 'https://www.youtube.com/oembed',
  gif: 'https://giphy.com/services/oembed'
};

export async function fetchOembed(
  type: PostType,
  url: string
): Promise<{ oembed_html: string; oembed_raw: Record<string, unknown> }> {
  const endpoint = OEMBED_ENDPOINTS[type];
  if (!endpoint) throw new Error(`No oEmbed endpoint for type: ${type}`);

  const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl);

  if (!res.ok) throw new Error(`oEmbed fetch failed: ${res.status} for ${url}`);

  const raw = await res.json();
  return { oembed_html: raw.html ?? '', oembed_raw: raw };
}
