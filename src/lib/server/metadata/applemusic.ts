export function buildAppleMusicEmbed(url: string): string {
  const parsed = new URL(url);
  if (parsed.hostname !== 'music.apple.com') {
    throw new Error(`Not an Apple Music URL: ${url}`);
  }

  // Convert https://music.apple.com/us/album/name/id
  // to    https://embed.music.apple.com/us/album/name/id
  const embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');

  return `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${embedUrl}"></iframe>`;
}
