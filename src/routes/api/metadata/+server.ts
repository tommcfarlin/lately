// src/routes/api/metadata/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { detectUrlType } from '$lib/server/metadata/detect';
import { fetchOembed } from '$lib/server/metadata/oembed';
import { buildAppleMusicEmbed } from '$lib/server/metadata/applemusic';
import { searchTmdb } from '$lib/server/metadata/tmdb';
import { lookupByIsbn, searchBooks } from '$lib/server/metadata/openlibrary';

// POST /api/metadata
// Body: { url?: string, type?: string, query?: string, isbn?: string, author?: string }
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { url, type, query, isbn, author } = body;

  // URL-based detection
  if (url) {
    const detected = detectUrlType(url);

    if (detected === 'tweet' || detected === 'video') {
      const data = await fetchOembed(detected, url);
      return json({ type: detected, data: { ...data, tweet_url: url, url } });
    }

    if (detected === 'gif') {
      const { hostname } = new URL(url);
      if (hostname === 'giphy.com' || hostname === 'media.giphy.com') {
        const data = await fetchOembed('gif', url);
        return json({ type: 'gif', data: { gif_url: url, source: 'giphy', oembed_html: data.oembed_html } });
      }
      if (hostname === 'tenor.com') {
        const data = await fetchOembed('gif', url);
        return json({ type: 'gif', data: { gif_url: url, source: 'tenor', oembed_html: data.oembed_html } });
      }
      return json({ type: 'gif', data: { gif_url: url, source: 'direct' } });
    }

    if (detected === 'music') {
      const { hostname } = new URL(url);
      if (hostname === 'open.spotify.com') {
        const data = await fetchOembed('music', url);
        return json({ type: 'music', data: { service: 'spotify', url, ...data } });
      }
      if (hostname === 'music.apple.com') {
        const oembed_html = buildAppleMusicEmbed(url);
        return json({ type: 'music', data: { service: 'apple_music', url, oembed_html } });
      }
    }

    return error(422, 'URL type could not be detected');
  }

  // ISBN lookup
  if (isbn) {
    const data = await lookupByIsbn(isbn);
    return json({ type: 'book', data });
  }

  // Book search
  if (type === 'book' && query) {
    const results = await searchBooks(query, author);
    return json({ type: 'book', results });
  }

  // TMDB search
  if ((type === 'movie' || type === 'tv') && query) {
    const results = await searchTmdb(query, type);
    return json({ type, results });
  }

  return error(400, 'Invalid request — provide url, isbn, or type + query');
};
