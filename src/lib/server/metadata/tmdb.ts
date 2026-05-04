import type { MovieData, TvData } from '@/lib/types/post';

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function searchMovies(query: string): Promise<MovieData[]> {
  const res = await fetch(
    `${BASE}/search/movie?query=${encodeURIComponent(query)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  const json = await res.json();

  return json.results.slice(0, 5).map((r: Record<string, unknown>) => ({
    title: r.title as string,
    year: r.release_date ? parseInt((r.release_date as string).slice(0, 4)) : undefined,
    tmdb_id: r.id as number,
    cover_url: r.poster_path ? `${IMG}${r.poster_path}` : undefined,
    tmdb_url: `https://www.themoviedb.org/movie/${r.id}`,
  }));
}

export async function searchTv(query: string): Promise<TvData[]> {
  const res = await fetch(
    `${BASE}/search/tv?query=${encodeURIComponent(query)}`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  const json = await res.json();

  return json.results.slice(0, 5).map((r: Record<string, unknown>) => ({
    title: r.name as string,
    tmdb_id: r.id as number,
    cover_url: r.poster_path ? `${IMG}${r.poster_path}` : undefined,
    tmdb_url: `https://www.themoviedb.org/tv/${r.id}`,
  }));
}
