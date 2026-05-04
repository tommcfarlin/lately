'use client';

import { useState } from 'react';

interface CaptionInputProps {
  onConfirm: (caption: string | null) => void;
  onBack: () => void;
}

export default function CaptionInput({ onConfirm, onBack }: CaptionInputProps) {
  const [caption, setCaption] = useState('');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
          Caption <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a thought..."
          rows={3}
          autoFocus
          className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(null)}
          className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          Skip
        </button>
        <button
          onClick={() => onConfirm(caption.trim() || null)}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
        >
          Post
        </button>
      </div>
    </div>
  );
}
