import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
  const { email } = await request.json();
  if (!email) return error(400, 'Email required');

  const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email
  });

  if (authError) return error(500, authError.message);
  return json({ ok: true });
};
