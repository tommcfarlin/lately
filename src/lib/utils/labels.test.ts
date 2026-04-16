import { describe, it, expect } from 'vitest';
import { getPostLabel } from './labels';

describe('getPostLabel', () => {
	it('returns Reading for book', () => expect(getPostLabel('book')).toBe('Reading'));
	it('returns Watching for tv', () => expect(getPostLabel('tv')).toBe('Watching'));
	it('returns Watching for movie', () => expect(getPostLabel('movie')).toBe('Watching'));
	it('returns Sharing for tweet', () => expect(getPostLabel('tweet')).toBe('Sharing'));
	it('returns Sharing for gif', () => expect(getPostLabel('gif')).toBe('Sharing'));
	it('returns Sharing for photo', () => expect(getPostLabel('photo')).toBe('Sharing'));
	it('returns Listening for music', () => expect(getPostLabel('music')).toBe('Listening'));
	it('returns Watching for video', () => expect(getPostLabel('video')).toBe('Watching'));
});
