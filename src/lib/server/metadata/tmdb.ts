import { TMDB_API_KEY } from '$env/static/private';
import type { MovieData, TvData } from '$lib/types/post';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

type TmdbSearchResult = (Partial<MovieData> & Partial<TvData>) & {
  tmdb_id: number;
  title: string;
  cover_url?: string;
};

export async function searchTmdb(
  query: string,
  type: 'movie' | 'tv'
): Promise<TmdbSearchResult[]> {
  const endpoint = `${TMDB_BASE}/search/${type}?query=${encodeURIComponent(query)}&language=en-US&page=1`;
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
  });

  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const json = await res.json();
  return json.results.slice(0, 8).map((item: any) => ({
    tmdb_id: item.id,
    title: item.title ?? item.name,
    year: item.release_date ? parseInt(item.release_date.slice(0, 4)) : undefined,
    cover_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined,
    tmdb_url: `https://www.themoviedb.org/${type}/${item.id}`
  }));
}

export async function getTmdbItem(
  tmdbId: number,
  type: 'movie' | 'tv'
): Promise<MovieData | TvData> {
  const res = await fetch(`${TMDB_BASE}/${type}/${tmdbId}?language=en-US`, {
    headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
  });

  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);

  const item = await res.json();

  if (type === 'movie') {
    return {
      title: item.title,
      year: item.release_date ? parseInt(item.release_date.slice(0, 4)) : undefined,
      tmdb_id: item.id,
      cover_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined,
      tmdb_url: `https://www.themoviedb.org/movie/${item.id}`
    } satisfies MovieData;
  }

  return {
    title: item.name,
    tmdb_id: item.id,
    cover_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined,
    tmdb_url: `https://www.themoviedb.org/tv/${item.id}`
  } satisfies TvData;
}
