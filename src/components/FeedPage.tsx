'use client';

import { useState, useCallback } from 'react';
import type { Post } from '@/lib/types/post';
import Feed from '@/components/Feed';
import AddButton from '@/components/AddButton';
import AddModal from '@/components/AddModal';

interface FeedPageProps {
  initialPosts: Post[];
  initialTotal: number;
  isOwner: boolean;
}

export default function FeedPage({ initialPosts, initialTotal, isOwner }: FeedPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);

  const handlePosted = useCallback(async () => {
    // Refetch first page to get the new post at the top
    const res = await fetch('/api/posts?page=1&perPage=20');
    const json = await res.json();
    setPosts(json.posts);
    setTotal(json.total);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  return (
    <>
      <Feed
        initialPosts={posts}
        initialTotal={total}
        isOwner={isOwner}
        onDelete={handleDelete}
      />
      {isOwner && (
        <>
          <AddButton onClick={() => setModalOpen(true)} />
          {modalOpen && (
            <AddModal
              onClose={() => setModalOpen(false)}
              onPosted={handlePosted}
            />
          )}
        </>
      )}
    </>
  );
}
