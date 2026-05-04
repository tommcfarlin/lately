'use client';

import type { Post } from '@/lib/types/post';
import PostCard from '@/components/PostCard';

interface MetadataPreviewProps {
  post: Omit<Post, 'id' | 'user_id' | 'created_at'> & { created_at?: string };
  onConfirm: () => void;
  onBack: () => void;
}

export default function MetadataPreview({ post, onConfirm, onBack }: MetadataPreviewProps) {
  const previewPost: Post = {
    ...post,
    id: 'preview',
    user_id: 'preview',
    created_at: post.created_at ?? new Date().toISOString(),
    caption: post.caption ?? null,
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">Preview</p>
      <PostCard post={previewPost} />
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
        >
          Looks good
        </button>
      </div>
    </div>
  );
}
