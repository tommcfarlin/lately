import { redirect } from '@sveltejs/kit';
import { LATELY_USERNAME } from '$env/static/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  throw redirect(301, `/${LATELY_USERNAME}`);
};
