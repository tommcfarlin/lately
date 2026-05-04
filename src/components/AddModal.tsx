'use client';

import { useState, useEffect, useRef } from 'react';
import type { PostType, PostData, QuoteData, PhotoData } from '@/lib/types/post';
import UrlInput from './add-steps/UrlInput';
import TypePicker from './add-steps/TypePicker';
import MetadataPreview from './add-steps/MetadataPreview';
import QuoteForm from './add-steps/QuoteForm';
import PhotoUpload from './add-steps/PhotoUpload';
import CaptionInput from './add-steps/CaptionInput';

type Step =
  | 'input'
  | 'type-picker'
  | 'preview'
  | 'quote-form'
  | 'photo-upload'
  | 'caption';

interface PendingPost {
  type: PostType;
  data: PostData;
}

interface AddModalProps {
  onClose: () => void;
  onPosted: () => void;
}

export default function AddModal({ onClose, onPosted }: AddModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [pending, setPending] = useState<PendingPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetching, setFetching] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function fetchMetadata(body: Record<string, unknown>): Promise<void> {
    setFetching(true);
    setError('');
    const res = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setFetching(false);
    if (!res.ok) {
      setError('Could not fetch metadata. Try again.');
      return;
    }
    const json = await res.json();
    setPending({ type: json.type, data: json.data ?? json.results?.[0] ?? {} });
    setStep('preview');
  }

  async function handleUrl(url: string) {
    await fetchMetadata({ url });
  }

  function handleSearch(term: string) {
    setSearchTerm(term);
    setStep('type-picker');
  }

  async function handleTypeSelect(type: PostType) {
    if (type === 'movie' || type === 'tv' || type === 'book') {
      await fetchMetadata({ type, query: searchTerm });
    } else {
      // For types that don't need search, fetch via the term as a generic link
      await fetchMetadata({ url: searchTerm.startsWith('http') ? searchTerm : `https://${searchTerm}` });
    }
  }

  function handleManual(type: 'quote' | 'photo') {
    if (type === 'quote') setStep('quote-form');
    if (type === 'photo') setStep('photo-upload');
  }

  function handleQuoteConfirm(data: QuoteData) {
    setPending({ type: 'quote', data });
    setStep('caption');
  }

  function handlePhotoConfirm(data: PhotoData) {
    setPending({ type: 'photo', data });
    setStep('caption');
  }

  function handlePreviewConfirm() {
    setStep('caption');
  }

  async function handleCaption(caption: string | null) {
    if (!pending) return;
    setPosting(true);
    setError('');
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: pending.type, data: pending.data, caption }),
    });
    setPosting(false);
    if (!res.ok) {
      setError('Failed to post. Try again.');
      return;
    }
    onPosted();
    onClose();
  }

  const stepTitles: Record<Step, string> = {
    'input': 'Add post',
    'type-picker': 'What type?',
    'preview': 'Preview',
    'quote-form': 'Add quote',
    'photo-upload': 'Upload photo',
    'caption': 'Add caption',
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {stepTitles[step]}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}

          {fetching && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
              Fetching…
            </p>
          )}

          {!fetching && step === 'input' && (
            <UrlInput
              onUrl={handleUrl}
              onSearch={handleSearch}
              onSelectManual={handleManual}
            />
          )}

          {!fetching && step === 'type-picker' && (
            <TypePicker
              onSelect={handleTypeSelect}
              onBack={() => setStep('input')}
            />
          )}

          {!fetching && step === 'preview' && pending && (
            <MetadataPreview
              post={{ type: pending.type, data: pending.data, caption: null }}
              onConfirm={handlePreviewConfirm}
              onBack={() => setStep(searchTerm ? 'type-picker' : 'input')}
            />
          )}

          {!fetching && step === 'quote-form' && (
            <QuoteForm
              onConfirm={handleQuoteConfirm}
              onBack={() => setStep('input')}
            />
          )}

          {!fetching && step === 'photo-upload' && (
            <PhotoUpload
              onConfirm={handlePhotoConfirm}
              onBack={() => setStep('input')}
            />
          )}

          {!fetching && step === 'caption' && (
            <CaptionInput
              onConfirm={handleCaption}
              onBack={() => {
                if (pending?.type === 'quote') setStep('quote-form');
                else if (pending?.type === 'photo') setStep('photo-upload');
                else setStep('preview');
              }}
            />
          )}

          {posting && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-2">
              Posting…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
