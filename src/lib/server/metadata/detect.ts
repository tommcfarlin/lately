import type { PostType } from '@/lib/types/post';

export function detectUrlType(url: string): PostType | null {
  try {
    const { hostname } = new URL(url);
    const h = hostname.replace('www.', '');

    if (h === 'open.spotify.com') return 'music';
    if (h === 'music.apple.com') return 'music';
    if (h === 'youtube.com' || h === 'youtu.be') return 'video';
    if (h === 'vimeo.com') return 'video';
    if (h === 'twitter.com' || h === 'x.com') return 'social';
    if (h === 'instagram.com') return 'social';
    if (h === 'facebook.com') return 'social';
    if (h === 'overcast.fm') return 'podcast';
    if (h === 'pocketcasts.com') return 'podcast';
    if (h === 'podcasts.apple.com') return 'podcast';
    if (h === 'podcasts.google.com') return 'podcast';
    if (h === 'castro.fm') return 'podcast';

    return null; // Falls through to 'link'
  } catch {
    return null;
  }
}
