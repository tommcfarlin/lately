import { describe, it, expect } from 'vitest';
import { buildAppleMusicEmbed } from './applemusic';

describe('buildAppleMusicEmbed', () => {
  it('builds embed HTML for a track URL', () => {
    const html = buildAppleMusicEmbed('https://music.apple.com/us/album/test/123?i=456');
    expect(html).toContain('embed.music.apple.com');
    expect(html).toContain('<iframe');
  });

  it('builds embed HTML for an album URL', () => {
    const html = buildAppleMusicEmbed('https://music.apple.com/us/album/test/123');
    expect(html).toContain('embed.music.apple.com');
  });

  it('throws for non-Apple Music URLs', () => {
    expect(() => buildAppleMusicEmbed('https://spotify.com/track/abc')).toThrow();
  });
});
