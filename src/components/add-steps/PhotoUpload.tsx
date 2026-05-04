'use client';

import { useState, useRef } from 'react';
import type { PhotoData } from '@/lib/types/post';

interface PhotoUploadProps {
  onConfirm: (data: PhotoData) => void;
  onBack: () => void;
}

export default function PhotoUpload({ onConfirm, onBack }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<PhotoData | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(json.error ?? 'Upload failed');
      setPreview(null);
      return;
    }

    setUploaded(json);
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
        ) : (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {uploading ? 'Uploading…' : 'Click to select a photo'}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => uploaded && onConfirm(uploaded)}
          disabled={!uploaded || uploading}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
}
