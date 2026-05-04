'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/client/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setLoading(false);
    if (err) {
      setError('Something went wrong. Try again.');
    } else {
      setSent(true);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-4">
      {sent ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Check your email — a magic link is on its way.
        </p>
      ) : (
        <>
          <h1 className="text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100">
            Sign in
          </h1>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="you@example.com"
              className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '…' : 'Send link'}
            </button>
          </div>
          {error && <p className="text-xs mt-2 text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
}
