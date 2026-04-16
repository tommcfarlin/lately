import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase admin client
vi.mock('$lib/server/supabase', () => ({
	supabaseAdmin: {
		from: vi.fn()
	}
}));

import { listPublicPosts, getPost } from './posts';
import { supabaseAdmin } from '$lib/server/supabase';

describe('listPublicPosts', () => {
	beforeEach(() => vi.clearAllMocks());

	it('queries posts filtered by is_private false', async () => {
		const mockRange = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
		const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
		const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

		vi.mocked(supabaseAdmin.from).mockReturnValue({
			select: mockSelect
		} as any);

		await listPublicPosts({ page: 1, perPage: 20 });

		expect(supabaseAdmin.from).toHaveBeenCalledWith('posts');
		expect(mockEq).toHaveBeenCalledWith('is_private', false);
		expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
	});

	it('returns empty array and zero total on no posts', async () => {
		const mockRange = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
		const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
		const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

		vi.mocked(supabaseAdmin.from).mockReturnValue({ select: mockSelect } as any);

		const result = await listPublicPosts();
		expect(result.posts).toEqual([]);
		expect(result.total).toBe(0);
	});
});

describe('getPost', () => {
	beforeEach(() => vi.clearAllMocks());

	it('fetches a single post by id', async () => {
		const mockPost = { id: 'abc', type: 'book', data: {}, is_private: false };
		const mockSingle = vi.fn().mockResolvedValue({ data: mockPost, error: null });
		const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

		vi.mocked(supabaseAdmin.from).mockReturnValue({ select: mockSelect } as any);

		const result = await getPost('abc');
		expect(result).toEqual(mockPost);
	});

	it('returns null when post not found', async () => {
		const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
		const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

		vi.mocked(supabaseAdmin.from).mockReturnValue({ select: mockSelect } as any);

		const result = await getPost('missing');
		expect(result).toBeNull();
	});
});
