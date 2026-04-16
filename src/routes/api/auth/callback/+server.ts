import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { LATELY_USERNAME } from '$env/static/private';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  if (!code) throw redirect(303, `/${LATELY_USERNAME}`);

  const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
  if (error || !data.session) throw redirect(303, `/${LATELY_USERNAME}`);

  cookies.set('sb-access-token', data.session.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  cookies.set('sb-refresh-token', data.session.refresh_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30
  });

  throw redirect(303, `/${LATELY_USERNAME}`);
};
