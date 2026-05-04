import type { Post } from '@/lib/types/post';
import type { MusicData, VideoData, MovieData, TvData, BookData, QuoteData, PhotoData, LinkData, PodcastData, SocialData } from '@/lib/types/post';
import PostIcon from './PostIcon';
import { getPostLabel } from '@/lib/utils/labels';
import { formatPostDate } from '@/lib/utils/date';
import MusicCard from './post-types/MusicCard';
import VideoCard from './post-types/VideoCard';
import MovieCard from './post-types/MovieCard';
import TvCard from './post-types/TvCard';
import BookCard from './post-types/BookCard';
import QuoteCard from './post-types/QuoteCard';
import PhotoCard from './post-types/PhotoCard';
import LinkCard from './post-types/LinkCard';
import PodcastCard from './post-types/PodcastCard';
import SocialCard from './post-types/SocialCard';

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
}

function PostContent({ post }: { post: Post }) {
  switch (post.type) {
    case 'music':  return <MusicCard data={post.data as MusicData} />;
    case 'video':  return <VideoCard data={post.data as VideoData} />;
    case 'movie':  return <MovieCard data={post.data as MovieData} />;
    case 'tv':     return <TvCard data={post.data as TvData} />;
    case 'book':   return <BookCard data={post.data as BookData} />;
    case 'quote':  return <QuoteCard data={post.data as QuoteData} />;
    case 'photo':  return <PhotoCard data={post.data as PhotoData} />;
    case 'link':   return <LinkCard data={post.data as LinkData} />;
    case 'podcast':return <PodcastCard data={post.data as PodcastData} />;
    case 'social': return <SocialCard data={post.data as SocialData} />;
  }
}

export default function PostCard({ post, isOwner, onEdit, onDelete }: PostCardProps) {
  return (
    <article className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <PostIcon type={post.type} className="w-3.5 h-3.5" />
          <span>{getPostLabel(post.type)}</span>
        </div>
        <div className="flex items-center gap-3">
          <time className="text-xs text-neutral-400 dark:text-neutral-500">
            {formatPostDate(post.created_at)}
          </time>
          {isOwner && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit?.(post)}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete?.(post.id)}
                className="text-xs text-neutral-400 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <PostContent post={post} />

      {post.caption && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {post.caption}
        </p>
      )}
    </article>
  );
}
