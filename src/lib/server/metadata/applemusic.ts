// Apple Music does not support standard oEmbed.
// Convert share URLs to embed URLs directly.
export function appleMusicEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('music.apple.com')) return null;

    // https://music.apple.com/us/album/name/id?i=trackid
    // → https://embed.music.apple.com/us/album/name/id?i=trackid
    u.hostname = 'embed.music.apple.com';
    return u.toString();
  } catch {
    return null;
  }
}
