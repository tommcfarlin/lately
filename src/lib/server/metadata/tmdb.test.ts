import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/static/private', () => ({ TMDB_API_KEY: 'test-key' }));
global.fetch = vi.fn();

import { searchTmdb, getTmdbItem } from './tmdb';

describe('searchTmdb', () => {
  it('searches movies and returns results', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 1, title: 'Interstellar', release_date: '2014-11-05', poster_path: '/abc.jpg', media_type: 'movie' }]
      })
    } as Response);

    const results = await searchTmdb('Interstellar', 'movie');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Interstellar');
    expect(results[0].cover_url).toContain('image.tmdb.org');
  });

  it('searches TV and maps name field to title', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 2, name: 'Severance', first_air_date: '2022-02-18', poster_path: '/def.jpg' }]
      })
    } as Response);

    const results = await searchTmdb('Severance', 'tv');
    expect(results[0].title).toBe('Severance');
  });
});
