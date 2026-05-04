import { describe, it, expect } from 'vitest';
import { generateRss } from '@/lib/utils/rss';
import type { Post } from '@/lib/types/post';

const BASE_URL = 'https://example.com';
const TITLE = 'Tom McFarlin';
const SUBTITLE = 'writer, developer, coffee drinker';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-123',
    user_id: 'user-abc',
    type: 'link',
    caption: null,
    created_at: '2026-01-15T12:00:00.000Z',
    data: { url: 'https://example.com/article', title: 'An Article' },
    ...overrides,
  };
}

describe('generateRss', () => {
  it('returns valid RSS 2.0 XML', () => {
    const rss = generateRss([], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(rss).toContain('<rss version="2.0">');
    expect(rss).toContain('</rss>');
  });

  it('includes channel metadata', () => {
    const rss = generateRss([], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain(`<title>${TITLE}</title>`);
    expect(rss).toContain(`<description>${SUBTITLE}</description>`);
    expect(rss).toContain(`<link>${BASE_URL}</link>`);
  });

  it('generates an item for each post', () => {
    const posts = [makePost({ id: 'post-1' }), makePost({ id: 'post-2' })];
    const rss = generateRss(posts, BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain(`${BASE_URL}/post/post-1`);
    expect(rss).toContain(`${BASE_URL}/post/post-2`);
  });

  it('includes post permalink as link and guid', () => {
    const post = makePost();
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain(`<link>${BASE_URL}/post/post-123</link>`);
    expect(rss).toContain(`<guid>${BASE_URL}/post/post-123</guid>`);
  });

  it('includes pubDate from created_at', () => {
    const post = makePost();
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('<pubDate>');
    expect(rss).toContain('2026');
  });

  it('uses type label and title in item title for link posts', () => {
    const post = makePost({ type: 'link', data: { url: 'https://x.com', title: 'Cool Link' } });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('<title>Link: Cool Link</title>');
  });

  it('uses type label and title for music posts', () => {
    const post = makePost({
      type: 'music',
      data: { service: 'spotify', url: 'https://open.spotify.com/track/x', title: 'Song Name' },
    });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('<title>Listening: Song Name</title>');
  });

  it('includes caption in description', () => {
    const post = makePost({ caption: 'Really interesting read' });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('Really interesting read');
  });

  it('includes attribution in description for quote posts', () => {
    const post = makePost({
      type: 'quote',
      data: { text: 'To be or not to be', attribution: 'Shakespeare', source: 'Hamlet' },
    });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('Shakespeare');
    expect(rss).toContain('Hamlet');
  });

  it('escapes XML special characters in title', () => {
    const post = makePost({
      data: { url: 'https://x.com', title: 'Tom & Jerry <show>' },
    });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('Tom &amp; Jerry &lt;show&gt;');
  });

  it('escapes XML special characters in description', () => {
    const post = makePost({ caption: 'A "great" post & more' });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('A &quot;great&quot; post &amp; more');
  });

  it('handles posts with no title gracefully', () => {
    const post = makePost({ type: 'photo', data: { storage_path: 'x/y.jpg', public_url: 'https://cdn.example.com/y.jpg' } });
    const rss = generateRss([post], BASE_URL, TITLE, SUBTITLE);
    expect(rss).toContain('<title>Photo</title>');
  });

  it('returns empty channel for zero posts', () => {
    const rss = generateRss([], BASE_URL, TITLE, SUBTITLE);
    expect(rss).not.toContain('<item>');
  });
});
