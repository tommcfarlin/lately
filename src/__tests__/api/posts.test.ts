import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock cookies and supabase before importing the route
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/server/posts', () => ({
  listPosts: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { listPosts, createPost, updatePost, deletePost } from '@/lib/server/posts';
import { GET, POST, PATCH, DELETE } from '@/app/api/posts/route';

const OWNER_ID = 'owner-uuid-123';

function mockCookies() {
  (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    setAll: () => {},
  });
}

function mockSession(userId: string | null) {
  (createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: userId ? { user: { id: userId } } : null },
      }),
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.LATELY_USER_ID = OWNER_ID;
  mockCookies();
});

// --- GET ---

describe('GET /api/posts', () => {
  it('returns paginated posts without auth', async () => {
    (listPosts as ReturnType<typeof vi.fn>).mockResolvedValue({
      posts: [{ id: '1', type: 'link' }],
      total: 1,
    });

    const req = new NextRequest('http://localhost/api/posts?page=1&perPage=20');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.posts).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it('uses default pagination values', async () => {
    (listPosts as ReturnType<typeof vi.fn>).mockResolvedValue({ posts: [], total: 0 });

    const req = new NextRequest('http://localhost/api/posts');
    await GET(req);

    expect(listPosts).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });
});

// --- POST ---

describe('POST /api/posts', () => {
  it('rejects unauthenticated requests', async () => {
    mockSession(null);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ type: 'link', data: { url: 'https://example.com' } }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('rejects requests from non-owner authenticated users', async () => {
    mockSession('some-other-user-uuid');

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ type: 'link', data: { url: 'https://example.com' } }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when type is missing', async () => {
    mockSession(OWNER_ID);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ data: { url: 'https://example.com' } }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when data is missing', async () => {
    mockSession(OWNER_ID);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ type: 'link' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('creates a post for the owner', async () => {
    mockSession(OWNER_ID);
    const mockPost = { id: 'new-post-id', type: 'link', data: { url: 'https://example.com' } };
    (createPost as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ type: 'link', data: { url: 'https://example.com' }, caption: 'cool link' }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe('new-post-id');
    expect(createPost).toHaveBeenCalledWith(OWNER_ID, {
      type: 'link',
      caption: 'cool link',
      data: { url: 'https://example.com' },
    });
  });

  it('defaults caption to null when not provided', async () => {
    mockSession(OWNER_ID);
    (createPost as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '1' });

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ type: 'link', data: { url: 'https://example.com' } }),
    });
    await POST(req);

    expect(createPost).toHaveBeenCalledWith(OWNER_ID, expect.objectContaining({ caption: null }));
  });
});

// --- PATCH ---

describe('PATCH /api/posts', () => {
  it('rejects unauthenticated requests', async () => {
    mockSession(null);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'PATCH',
      body: JSON.stringify({ id: '1', caption: 'updated' }),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    mockSession(OWNER_ID);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'PATCH',
      body: JSON.stringify({ caption: 'updated' }),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(400);
  });

  it('updates a post for the owner', async () => {
    mockSession(OWNER_ID);
    const mockPost = { id: '1', caption: 'updated' };
    (updatePost as ReturnType<typeof vi.fn>).mockResolvedValue(mockPost);

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'PATCH',
      body: JSON.stringify({ id: '1', caption: 'updated' }),
    });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.caption).toBe('updated');
    expect(updatePost).toHaveBeenCalledWith('1', { caption: 'updated' });
  });
});

// --- DELETE ---

describe('DELETE /api/posts', () => {
  it('rejects unauthenticated requests', async () => {
    mockSession(null);

    const req = new NextRequest('http://localhost/api/posts?id=1', { method: 'DELETE' });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    mockSession(OWNER_ID);

    const req = new NextRequest('http://localhost/api/posts', { method: 'DELETE' });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });

  it('deletes a post for the owner', async () => {
    mockSession(OWNER_ID);
    (deletePost as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const req = new NextRequest('http://localhost/api/posts?id=1', { method: 'DELETE' });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(deletePost).toHaveBeenCalledWith('1');
  });
});
