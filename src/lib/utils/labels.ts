import type { PostType } from '$lib/types/post';

const LABELS: Record<PostType, string> = {
	book: 'Reading',
	tv: 'Watching',
	movie: 'Watching',
	tweet: 'Sharing',
	gif: 'Sharing',
	photo: 'Sharing',
	music: 'Listening',
	video: 'Watching'
};

export function getPostLabel(type: PostType): string {
	return LABELS[type];
}
