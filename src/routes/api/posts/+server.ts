// src/routes/api/posts/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { createPost, updatePost, deletePost } from '$lib/server/posts';

async function getAuthenticatedUserId(cookies: any): Promise<string> {
  const accessToken = cookies.get('sb-access-token');
  if (!accessToken) throw error(401, 'Unauthorized');

  const { data, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !data.user) throw error(401, 'Unauthorized');

  return data.user.id;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const userId = await getAuthenticatedUserId(cookies);
  const body = await request.json();
  const { type, caption, is_private, data: postData } = body;

  if (!type || !postData) return error(400, 'type and data required');

  const post = await createPost(userId, { type, caption, is_private: is_private ?? false, data: postData });
  return json(post, { status: 201 });
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
  await getAuthenticatedUserId(cookies);
  const { id, ...updates } = await request.json();
  if (!id) return error(400, 'id required');

  const post = await updatePost(id, updates);
  return json(post);
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
  await getAuthenticatedUserId(cookies);
  const { id } = await request.json();
  if (!id) return error(400, 'id required');

  await deletePost(id);
  return json({ ok: true });
};
