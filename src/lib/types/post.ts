export type PostType = 'book' | 'tv' | 'movie' | 'tweet' | 'gif' | 'photo' | 'music' | 'video';

export interface BookData {
	title: string;
	author: string;
	cover_url?: string;
	isbn?: string;
	source_url?: string;
}

export interface TvData {
	title: string;
	season?: number;
	tmdb_id: number;
	cover_url?: string;
	tmdb_url: string;
}

export interface MovieData {
	title: string;
	year?: number;
	tmdb_id: number;
	cover_url?: string;
	tmdb_url: string;
}

export interface TweetData {
	tweet_url: string;
	oembed_html: string;
	oembed_raw: Record<string, unknown>;
}

export interface GifData {
	gif_url: string;
	source: 'giphy' | 'tenor' | 'direct';
	oembed_html?: string;
}

export interface PhotoData {
	storage_path: string;
	public_url: string;
}

export interface MusicData {
	service: 'spotify' | 'apple_music';
	url: string;
	oembed_html?: string;
	oembed_raw?: Record<string, unknown>;
}

export interface VideoData {
	url: string;
	oembed_html: string;
	oembed_raw: Record<string, unknown>;
}

export type PostData =
	| BookData
	| TvData
	| MovieData
	| TweetData
	| GifData
	| PhotoData
	| MusicData
	| VideoData;

export interface Post {
	id: string;
	user_id: string;
	type: PostType;
	caption: string | null;
	is_private: boolean;
	created_at: string; // ISO UTC string
	data: PostData;
}
