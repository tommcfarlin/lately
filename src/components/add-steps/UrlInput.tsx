'use client';

import { useState } from 'react';

interface UrlInputProps {
  onUrl: (url: string) => void;
  onSearch: (term: string) => void;
  onSelectManual: (type: 'quote' | 'photo') => void;
}

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function UrlInput({ onUrl, onSearch, onSelectManual }: UrlInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (isUrl(trimmed)) {
      onUrl(trimmed);
    } else {
      onSearch(trimmed);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
          Paste a URL or enter a search term
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="https://... or search for a movie, book..."
            autoFocus
            className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-100 dark:bg-neutral-800" />
        <span className="text-xs text-neutral-400">or add manually</span>
        <div className="h-px flex-1 bg-neutral-100 dark:bg-neutral-800" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSelectManual('quote')}
          className="flex-1 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
        >
          Quote
        </button>
        <button
          onClick={() => onSelectManual('photo')}
          className="flex-1 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
        >
          Photo
        </button>
      </div>
    </div>
  );
}
