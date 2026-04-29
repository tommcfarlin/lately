export type PostType =
  | 'music'
  | 'video'
  | 'movie'
  | 'tv'
  | 'book'
  | 'quote'
  | 'photo'
  | 'link'
  | 'podcast'
  | 'social';

export interface MusicData {
  service: 'spotify' | 'apple_music';
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  artwork_url?: string;
  oembed_html?: string;
}

export interface VideoData {
  url: string;
  title?: string;
  author?: string;
  thumbnail_url?: string;
  oembed_html: string;
}

export interface MovieData {
  title: string;
  year?: number;
  tmdb_id: number;
  cover_url?: string;
  tmdb_url: string;
}

export interface TvData {
  title: string;
  season?: number;
  tmdb_id: number;
  cover_url?: string;
  tmdb_url: string;
}

export interface BookData {
  title: string;
  author: string;
  cover_url?: string;
  isbn?: string;
  source_url?: string;
}

export interface QuoteData {
  text: string;
  attribution?: string;
  source?: string;
  source_url?: string;
}

export interface PhotoData {
  storage_path: string;
  public_url: string;
}

export interface LinkData {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
}

export interface PodcastData {
  url: string;
  title?: string;
  show?: string;
  artwork_url?: string;
  description?: string;
}

export interface SocialData {
  url: string;
  service: 'x' | 'instagram' | 'facebook';
  oembed_html?: string;
  oembed_raw?: Record<string, unknown>;
}

export type PostData =
  | MusicData
  | VideoData
  | MovieData
  | TvData
  | BookData
  | QuoteData
  | PhotoData
  | LinkData
  | PodcastData
  | SocialData;

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  caption: string | null;
  created_at: string;
  data: PostData;
}
