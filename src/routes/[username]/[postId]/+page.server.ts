import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';
import { LATELY_USERNAME, LATELY_SITE_TITLE, PUBLIC_BASE_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ params, parent }) => {
  const { isOwner } = await parent();

  if (params.username !== LATELY_USERNAME) throw error(404, 'Not found');

  const post = await getPost(params.postId);
  if (!post) throw error(404, 'Post not found');
  if (post.is_private && !isOwner) throw error(404, 'Post not found');

  return {
    post,
    ogTitle: LATELY_SITE_TITLE,
    ogUrl: `${PUBLIC_BASE_URL}/${LATELY_USERNAME}/${post.id}`
  };
};
