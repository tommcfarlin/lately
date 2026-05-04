import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/server/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    rotate: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  })),
}));

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/server/supabase';
import { POST } from '@/app/api/upload/route';

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

function mockStorage(uploadError: null | { message: string } = null) {
  const getPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: 'https://storage.example.com/photos/owner/123.jpg' },
  });
  const upload = vi.fn().mockResolvedValue({ error: uploadError });
  const bucket = { upload, getPublicUrl };
  vi.mocked(supabaseAdmin.storage.from).mockReturnValue(bucket as never);
  return { upload, getPublicUrl };
}

function makeFile(options: { name?: string; type?: string; size?: number } = {}) {
  const { name = 'photo.jpg', type = 'image/jpeg', size = 1024 } = options;
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

function makeRequest(file?: File | null) {
  const formData = new FormData();
  if (file) formData.append('file', file);

  return new NextRequest('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.LATELY_USER_ID = OWNER_ID;
  mockCookies();
});

describe('POST /api/upload', () => {
  it('rejects unauthenticated requests', async () => {
    mockSession(null);
    const res = await POST(makeRequest(makeFile()));
    expect(res.status).toBe(401);
  });

  it('rejects non-owner authenticated users', async () => {
    mockSession('someone-else');
    const res = await POST(makeRequest(makeFile()));
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is provided', async () => {
    mockSession(OWNER_ID);
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no file/i);
  });

  it('returns 415 for unsupported file types', async () => {
    mockSession(OWNER_ID);
    const file = makeFile({ name: 'doc.pdf', type: 'application/pdf' });
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error).toMatch(/unsupported file type/i);
  });

  it('returns 413 when file exceeds 10MB', async () => {
    mockSession(OWNER_ID);
    mockStorage(null); // safety net

    // jsdom's NextRequest doesn't preserve file size through FormData encoding,
    // so we mock formData() directly to return a file-like object with a large size.
    const largeFile = {
      arrayBuffer: async () => new ArrayBuffer(11 * 1024 * 1024),
      type: 'image/jpeg',
      size: 11 * 1024 * 1024,
    };
    const req = {
      formData: async () => ({ get: () => largeFile }),
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toMatch(/too large/i);
  });

  it('uploads a valid JPEG and returns storage path and public URL', async () => {
    mockSession(OWNER_ID);
    mockStorage(null);

    const file = makeFile();
    const res = await POST(makeRequest(file));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.storage_path).toMatch(/^owner-uuid-123\//);
    expect(json.public_url).toBe('https://storage.example.com/photos/owner/123.jpg');
  });

  it('accepts PNG files', async () => {
    mockSession(OWNER_ID);
    mockStorage(null);

    const file = makeFile({ name: 'photo.png', type: 'image/png' });
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(200);
  });

  it('accepts WebP files', async () => {
    mockSession(OWNER_ID);
    mockStorage(null);

    const file = makeFile({ name: 'photo.webp', type: 'image/webp' });
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(200);
  });

  it('returns 500 when Supabase storage upload fails', async () => {
    mockSession(OWNER_ID);
    mockStorage({ message: 'Storage quota exceeded' });

    const file = makeFile();
    const res = await POST(makeRequest(file));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Storage quota exceeded');
  });
});
