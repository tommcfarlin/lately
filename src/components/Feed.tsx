'use client';

import { useState } from 'react';
import type { Post } from '@/lib/types/post';
import PostCard from './PostCard';

interface FeedProps {
  initialPosts: Post[];
  initialTotal: number;
  isOwner: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (id: string) => void;
}

const PAGE_SIZE = 20;

export default function Feed({
  initialPosts,
  initialTotal,
  isOwner,
  onEdit,
  onDelete,
}: FeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const hasMore = posts.length < initialTotal;

  async function loadMore() {
    setLoading(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/posts?page=${nextPage}&perPage=${PAGE_SIZE}`);
    const json = await res.json();
    setPosts((prev) => [...prev, ...json.posts]);
    setPage(nextPage);
    setLoading(false);
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-neutral-400 dark:text-neutral-500">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isOwner={isOwner}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
