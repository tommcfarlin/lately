const OEMBED_ENDPOINTS: Record<string, string> = {
  'twitter.com': 'https://publish.twitter.com/oembed',
  'x.com': 'https://publish.twitter.com/oembed',
  'youtube.com': 'https://www.youtube.com/oembed',
  'youtu.be': 'https://www.youtube.com/oembed',
  'vimeo.com': 'https://vimeo.com/api/oembed.json',
  'open.spotify.com': 'https://open.spotify.com/oembed',
  'giphy.com': 'https://giphy.com/services/oembed',
  'tenor.com': 'https://tenor.com/oembed',
  'instagram.com': 'https://graph.facebook.com/v18.0/instagram_oembed',
};

export async function fetchOembed(url: string): Promise<Record<string, unknown> | null> {
  try {
    const { hostname } = new URL(url);
    const h = hostname.replace('www.', '');
    const endpoint = OEMBED_ENDPOINTS[h];
    if (!endpoint) return null;

    const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}
