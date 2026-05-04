'use client';

import type { PostType } from '@/lib/types/post';
import PostIcon from '@/components/PostIcon';
import { getPostLabel } from '@/lib/utils/labels';

const TYPES: PostType[] = ['music', 'video', 'movie', 'tv', 'book', 'link', 'podcast', 'social'];

interface TypePickerProps {
  onSelect: (type: PostType) => void;
  onBack: () => void;
}

export default function TypePicker({ onSelect, onBack }: TypePickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex items-center gap-2.5 px-3 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg text-left hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
          >
            <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
              <PostIcon type={type} className="w-4 h-4" />
            </span>
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {getPostLabel(type)}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onBack}
        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        ← Back
      </button>
    </div>
  );
}
