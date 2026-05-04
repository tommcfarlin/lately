import { NextRequest, NextResponse } from 'next/server';
import { detectUrlType } from '@/lib/server/metadata/detect';
import { fetchOembed } from '@/lib/server/metadata/oembed';
import { fetchOpenGraph } from '@/lib/server/metadata/opengraph';
import { searchMovies, searchTv } from '@/lib/server/metadata/tmdb';
import { searchBooks, lookupIsbn } from '@/lib/server/metadata/openlibrary';
import { appleMusicEmbedUrl } from '@/lib/server/metadata/applemusic';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ISBN lookup
  if (body.isbn) {
    const result = await lookupIsbn(body.isbn);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ type: 'book', data: result });
  }

  // TMDB search
  if (body.type === 'movie' && body.query) {
    const results = await searchMovies(body.query);
    return NextResponse.json({ type: 'movie', results });
  }
  if (body.type === 'tv' && body.query) {
    const results = await searchTv(body.query);
    return NextResponse.json({ type: 'tv', results });
  }

  // Book search
  if (body.type === 'book' && body.query) {
    const results = await searchBooks(body.query);
    return NextResponse.json({ type: 'book', results });
  }

  // URL-based detection
  if (body.url) {
    const url: string = body.url;
    const detectedType = detectUrlType(url);

    // Music
    if (detectedType === 'music') {
      if (url.includes('music.apple.com')) {
        const embedUrl = appleMusicEmbedUrl(url);
        const og = await fetchOpenGraph(url);
        return NextResponse.json({
          type: 'music',
          data: {
            service: 'apple_music',
            url,
            title: og.title,
            artist: og.site_name,
            artwork_url: og.image_url,
            oembed_html: embedUrl
              ? `<iframe src="${embedUrl}" height="150" frameborder="0" allow="autoplay *; encrypted-media *;"></iframe>`
              : undefined,
          },
        });
      }
      const oembed = await fetchOembed(url);
      return NextResponse.json({
        type: 'music',
        data: {
          service: 'spotify',
          url,
          oembed_html: (oembed as Record<string, unknown>)?.html as string | undefined,
        },
      });
    }

    // Video
    if (detectedType === 'video') {
      const oembed = await fetchOembed(url);
      return NextResponse.json({
        type: 'video',
        data: {
          url,
          title: (oembed as Record<string, unknown>)?.title as string | undefined,
          author: (oembed as Record<string, unknown>)?.author_name as string | undefined,
          thumbnail_url: (oembed as Record<string, unknown>)?.thumbnail_url as string | undefined,
          oembed_html: (oembed as Record<string, unknown>)?.html as string,
        },
      });
    }

    // Social
    if (detectedType === 'social') {
      const oembed = await fetchOembed(url);
      const { hostname } = new URL(url);
      const service = hostname.includes('instagram')
        ? 'instagram'
        : hostname.includes('facebook')
        ? 'facebook'
        : 'x';
      return NextResponse.json({
        type: 'social',
        data: {
          url,
          service,
          oembed_html: (oembed as Record<string, unknown>)?.html as string | undefined,
          oembed_raw: oembed ?? undefined,
        },
      });
    }

    // Podcast
    if (detectedType === 'podcast') {
      const og = await fetchOpenGraph(url);
      return NextResponse.json({
        type: 'podcast',
        data: {
          url,
          title: og.title,
          show: og.site_name,
          artwork_url: og.image_url,
          description: og.description,
        },
      });
    }

    // Link (OG fallback)
    const og = await fetchOpenGraph(url);
    return NextResponse.json({
      type: 'link',
      data: {
        url,
        title: og.title,
        description: og.description,
        image_url: og.image_url,
        site_name: og.site_name,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
