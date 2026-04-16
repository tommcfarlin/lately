import type { LayoutServerLoad } from './$types';
import {
  LATELY_USERNAME,
  LATELY_SITE_TITLE,
  LATELY_SUBTITLE,
  LATELY_SOCIAL_LINKS,
  PUBLIC_BASE_URL
} from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: LayoutServerLoad = async ({ cookies }) => {
  let isOwner = false;

  const accessToken = cookies.get('sb-access-token');
  if (accessToken) {
    const { data } = await supabaseAdmin.auth.getUser(accessToken);
    isOwner = !!data.user;
  }

  return {
    username: LATELY_USERNAME,
    siteTitle: LATELY_SITE_TITLE,
    subtitle: LATELY_SUBTITLE,
    socialLinks: JSON.parse(LATELY_SOCIAL_LINKS || '[]'),
    baseUrl: PUBLIC_BASE_URL,
    isOwner
  };
};
