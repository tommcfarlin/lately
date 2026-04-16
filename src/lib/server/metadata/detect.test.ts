import { describe, it, expect } from 'vitest';
import { detectUrlType } from './detect';

describe('detectUrlType', () => {
  it('detects twitter/x URLs', () => {
    expect(detectUrlType('https://twitter.com/user/status/123')).toBe('tweet');
    expect(detectUrlType('https://x.com/user/status/123')).toBe('tweet');
  });
  it('detects giphy URLs', () => {
    expect(detectUrlType('https://giphy.com/gifs/abc')).toBe('gif');
    expect(detectUrlType('https://media.giphy.com/media/abc/giphy.gif')).toBe('gif');
  });
  it('detects tenor URLs', () => {
    expect(detectUrlType('https://tenor.com/view/abc')).toBe('gif');
  });
  it('detects spotify URLs', () => {
    expect(detectUrlType('https://open.spotify.com/track/abc')).toBe('music');
    expect(detectUrlType('https://open.spotify.com/album/abc')).toBe('music');
  });
  it('detects apple music URLs', () => {
    expect(detectUrlType('https://music.apple.com/us/album/abc')).toBe('music');
  });
  it('detects youtube URLs', () => {
    expect(detectUrlType('https://www.youtube.com/watch?v=abc')).toBe('video');
    expect(detectUrlType('https://youtu.be/abc')).toBe('video');
  });
  it('returns null for unknown URLs', () => {
    expect(detectUrlType('https://example.com')).toBeNull();
  });
});
