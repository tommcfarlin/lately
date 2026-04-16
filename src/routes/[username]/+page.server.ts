// src/routes/[username]/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listPublicPosts, listAllPosts } from '$lib/server/posts';
import { LATELY_USERNAME, LATELY_SITE_TITLE, PUBLIC_BASE_URL } from '$env/static/private';

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ params, url, parent }) => {
  const { isOwner } = await parent();

  if (params.username !== LATELY_USERNAME) throw error(404, 'Not found');

  const page = parseInt(url.searchParams.get('page') ?? '1');
  const { posts, total } = isOwner
    ? await listAllPosts({ page, perPage: PER_PAGE })
    : await listPublicPosts({ page, perPage: PER_PAGE });

  return {
    posts,
    page,
    totalPages: Math.ceil(total / PER_PAGE),
    ogTitle: LATELY_SITE_TITLE,
    ogUrl: `${PUBLIC_BASE_URL}/${LATELY_USERNAME}`
  };
};
