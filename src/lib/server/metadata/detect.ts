import type { PostType } from '$lib/types/post';

export function detectUrlType(url: string): PostType | null {
  try {
    const { hostname, pathname } = new URL(url);

    if (hostname === 'twitter.com' || hostname === 'x.com') return 'tweet';
    if (hostname === 'giphy.com' || hostname === 'media.giphy.com') return 'gif';
    if (hostname === 'tenor.com') return 'gif';
    if (hostname === 'open.spotify.com') return 'music';
    if (hostname === 'music.apple.com') return 'music';
    if (hostname === 'www.youtube.com' || hostname === 'youtu.be') return 'video';

    return null;
  } catch {
    return null;
  }
}
