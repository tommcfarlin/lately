import { supabaseAdmin } from '$lib/server/supabase';
import type { Post } from '$lib/types/post';

const PAGE_SIZE = 20;

export async function listPublicPosts({
	page = 1,
	perPage = PAGE_SIZE
}: { page?: number; perPage?: number } = {}): Promise<{ posts: Post[]; total: number }> {
	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	const { data, error, count } = await supabaseAdmin
		.from('posts')
		.select('*', { count: 'exact' })
		.eq('is_private', false)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (error) throw new Error(error.message);
	return { posts: (data as Post[]) ?? [], total: count ?? 0 };
}

export async function listAllPosts({
	page = 1,
	perPage = PAGE_SIZE
}: { page?: number; perPage?: number } = {}): Promise<{ posts: Post[]; total: number }> {
	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	const { data, error, count } = await supabaseAdmin
		.from('posts')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(from, to);

	if (error) throw new Error(error.message);
	return { posts: (data as Post[]) ?? [], total: count ?? 0 };
}

export async function getPost(id: string): Promise<Post | null> {
	const { data, error } = await supabaseAdmin
		.from('posts')
		.select('*')
		.eq('id', id)
		.single();

	if (error) return null;
	return data as Post;
}

export async function createPost(
	userId: string,
	payload: Omit<Post, 'id' | 'user_id' | 'created_at'>
): Promise<Post> {
	const { data, error } = await supabaseAdmin
		.from('posts')
		.insert({ ...payload, user_id: userId })
		.select()
		.single();

	if (error) throw new Error(error.message);
	return data as Post;
}

export async function updatePost(
	id: string,
	updates: Partial<Pick<Post, 'caption' | 'is_private' | 'data'>>
): Promise<Post> {
	const { data, error } = await supabaseAdmin
		.from('posts')
		.update(updates)
		.eq('id', id)
		.select()
		.single();

	if (error) throw new Error(error.message);
	return data as Post;
}

export async function deletePost(id: string): Promise<void> {
	const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);

	if (error) throw new Error(error.message);
}
