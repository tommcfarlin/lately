// src/lib/server/metadata/oembed.test.ts
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

import { fetchOembed } from './oembed';

describe('fetchOembed', () => {
  it('fetches tweet oEmbed from publish.twitter.com', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: '<blockquote>tweet</blockquote>', type: 'rich' })
    } as Response);

    const result = await fetchOembed('tweet', 'https://x.com/user/status/123');
    expect(result.oembed_html).toBe('<blockquote>tweet</blockquote>');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('publish.twitter.com/oembed')
    );
  });

  it('fetches spotify oEmbed', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: '<iframe src="spotify"></iframe>', type: 'rich' })
    } as Response);

    const result = await fetchOembed('music', 'https://open.spotify.com/track/abc');
    expect(result.oembed_html).toContain('iframe');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('open.spotify.com/oembed')
    );
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    await expect(fetchOembed('video', 'https://youtube.com/watch?v=abc')).rejects.toThrow();
  });
});
