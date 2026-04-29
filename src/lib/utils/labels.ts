import type { PostType } from '@/lib/types/post';

export const POST_LABELS: Record<PostType, string> = {
  music: 'Listening',
  video: 'Watching',
  movie: 'Watching',
  tv: 'Watching',
  book: 'Reading',
  quote: 'Quote',
  photo: 'Photo',
  link: 'Link',
  podcast: 'Listening',
  social: 'Sharing',
};

export function getPostLabel(type: PostType): string {
  return POST_LABELS[type];
}
