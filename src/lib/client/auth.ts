import { supabase } from '$lib/client/supabase';

export async function sendMagicLink(email: string): Promise<void> {
  const res = await fetch('/api/auth/magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error('Failed to send magic link');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  window.location.reload();
}
