import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

import { lookupByIsbn, searchBooks } from './openlibrary';

describe('lookupByIsbn', () => {
  it('returns book data for a valid ISBN', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'The Name of the Wind',
        authors: [{ key: '/authors/OL123A' }],
        isbn_13: ['9780756404079']
      })
    } as Response);

    // second fetch for author name
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Patrick Rothfuss' })
    } as Response);

    const result = await lookupByIsbn('9780756404079');
    expect(result.title).toBe('The Name of the Wind');
    expect(result.author).toBe('Patrick Rothfuss');
    expect(result.cover_url).toContain('covers.openlibrary.org');
  });
});

describe('searchBooks', () => {
  it('returns book results for a title search', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [{ title: 'Dune', author_name: ['Frank Herbert'], isbn: ['9780441013593'] }]
      })
    } as Response);

    const results = await searchBooks('Dune', 'Frank Herbert');
    expect(results[0].title).toBe('Dune');
    expect(results[0].author).toBe('Frank Herbert');
  });
});
