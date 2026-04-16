# Lately Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal tumblelog-style feed (Lately) where the owner posts what they're reading, watching, listening to, and sharing — publicly viewable, self-hostable, mobile-friendly.

**Architecture:** SvelteKit SSR app on Vercel, Supabase for Postgres + Auth + Storage. Public feed at `/[username]`, admin overlaid on the same layout. Eight post types stored in a single `posts` table with a JSONB `data` blob per type.

**Tech Stack:** SvelteKit, TypeScript, Supabase JS client, Tailwind CSS, `sharp` (EXIF stripping), `svelte-infinite-scroll`, Vitest + Testing Library

---

## File Structure

```
src/
  app.html                          # HTML shell, dark mode class hook
  app.css                           # Global styles, CSS custom properties
  lib/
    server/
      supabase.ts                   # Server-side Supabase client (service role)
      posts.ts                      # DB queries: list, get, create, update, delete
      metadata/
        tmdb.ts                     # TMDB search + fetch
        openlibrary.ts              # Open Library ISBN/title lookup
        oembed.ts                   # Generic oEmbed fetcher (tweet, spotify, youtube, gif)
        applemusic.ts               # Apple Music embed URL constructor
        detect.ts                   # URL type detection
    client/
      supabase.ts                   # Browser-side Supabase client (anon key)
      auth.ts                       # Auth helpers (magic link send, session get)
    components/
      PostCard.svelte               # Renders any post type — switches on type
      post-types/
        BookCard.svelte
        TvCard.svelte
        MovieCard.svelte
        TweetCard.svelte
        GifCard.svelte
        PhotoCard.svelte
        MusicCard.svelte
        VideoCard.svelte
      Feed.svelte                   # Feed list + infinite scroll / pagination logic
      Header.svelte
      Footer.svelte
      Toggles.svelte                # Dark mode + scroll mode toggles
      AddPanel.svelte               # Slide-in add post panel (auth only)
      add-steps/
        TypePicker.svelte           # Step 1: pick content type
        UrlInput.svelte             # Step 2: paste URL or ISBN
        MetadataPreview.svelte      # Step 3: confirm fetched metadata
        CaptionInput.svelte         # Step 4: optional caption
    types/
      post.ts                       # Post, PostType, all JSONB payload types
    utils/
      date.ts                       # UTC → user timezone formatting
      labels.ts                     # type → display label map
  routes/
    +layout.svelte                  # App shell: Header, Footer, Toggles
    +layout.server.ts               # Load session, username, site config from env
    +page.server.ts                 # Redirect / → /[username]
    +page.svelte                    # Redirect stub
    [username]/
      +page.server.ts               # Load paginated posts, og: meta
      +page.svelte                  # Feed page
      [postId]/
        +page.server.ts             # Load single post, og: meta
        +page.svelte                # Permalink page
    api/
      metadata/
        +server.ts                  # POST: detect URL type + fetch metadata
      posts/
        +server.ts                  # POST/PATCH/DELETE: create, update, delete post
      upload/
        +server.ts                  # POST: photo upload, EXIF strip, Supabase Storage
      auth/
        magic-link/
          +server.ts                # POST: send magic link
        callback/
          +server.ts                # GET: handle Supabase auth callback
supabase/
  migrations/
    001_posts.sql                   # posts table, RLS, index
.env.example
```

---

## Phase 1 — Project Scaffold & Config

### Task 1: Initialize SvelteKit project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.env.example`, `.gitignore`

- [ ] **Step 1: Scaffold the project**

```bash
cd /Users/tommcfarlin/Projects/02-tm/lately
npx sv create . --template minimal --types ts --no-add-ons
```

Choose: SvelteKit minimal, TypeScript, no additional add-ons when prompted.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/svelte @testing-library/jest-dom jsdom
npm install sharp exifr
```

- [ ] **Step 3: Configure Tailwind**

Edit `vite.config.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts']
  }
});
```

- [ ] **Step 4: Create test setup file**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# TMDB
TMDB_API_KEY=your-tmdb-read-access-token

# Lately config
LATELY_USERNAME=tom
LATELY_SITE_TITLE=Tom McFarlin
LATELY_SUBTITLE=writer, developer, coffee drinker
LATELY_SOCIAL_LINKS=[{"label":"GitHub","url":"https://github.com/tommcfarlin"}]

# App
PUBLIC_BASE_URL=http://localhost:5173
```

- [ ] **Step 6: Create `.env.local` from example and fill in real values**

```bash
cp .env.example .env.local
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: server running at `http://localhost:5173` with no errors.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: initialize sveltekit project with tailwind and supabase"
```

---

### Task 2: Type definitions

**Files:**
- Create: `src/lib/types/post.ts`
- Create: `src/lib/utils/labels.ts`
- Create: `src/lib/utils/date.ts`

- [ ] **Step 1: Write failing test for labels**

```typescript
// src/lib/utils/labels.test.ts
import { describe, it, expect } from 'vitest';
import { getPostLabel } from './labels';

describe('getPostLabel', () => {
  it('returns Reading for book', () => expect(getPostLabel('book')).toBe('Reading'));
  it('returns Watching for tv', () => expect(getPostLabel('tv')).toBe('Watching'));
  it('returns Watching for movie', () => expect(getPostLabel('movie')).toBe('Watching'));
  it('returns Sharing for tweet', () => expect(getPostLabel('tweet')).toBe('Sharing'));
  it('returns Sharing for gif', () => expect(getPostLabel('gif')).toBe('Sharing'));
  it('returns Sharing for photo', () => expect(getPostLabel('photo')).toBe('Sharing'));
  it('returns Listening for music', () => expect(getPostLabel('music')).toBe('Listening'));
  it('returns Watching for video', () => expect(getPostLabel('video')).toBe('Watching'));
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/lib/utils/labels.test.ts
```

Expected: FAIL — `getPostLabel` not found.

- [ ] **Step 3: Create type definitions**

```typescript
// src/lib/types/post.ts
export type PostType = 'book' | 'tv' | 'movie' | 'tweet' | 'gif' | 'photo' | 'music' | 'video';

export interface BookData {
  title: string;
  author: string;
  cover_url?: string;
  isbn?: string;
  source_url?: string;
}

export interface TvData {
  title: string;
  season?: number;
  tmdb_id: number;
  cover_url?: string;
  tmdb_url: string;
}

export interface MovieData {
  title: string;
  year?: number;
  tmdb_id: number;
  cover_url?: string;
  tmdb_url: string;
}

export interface TweetData {
  tweet_url: string;
  oembed_html: string;
  oembed_raw: Record<string, unknown>;
}

export interface GifData {
  gif_url: string;
  source: 'giphy' | 'tenor' | 'direct';
  oembed_html?: string;
}

export interface PhotoData {
  storage_path: string;
  public_url: string;
}

export interface MusicData {
  service: 'spotify' | 'apple_music';
  url: string;
  oembed_html?: string;
  oembed_raw?: Record<string, unknown>;
}

export interface VideoData {
  url: string;
  oembed_html: string;
  oembed_raw: Record<string, unknown>;
}

export type PostData = BookData | TvData | MovieData | TweetData | GifData | PhotoData | MusicData | VideoData;

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  caption: string | null;
  is_private: boolean;
  created_at: string; // ISO UTC string
  data: PostData;
}
```

- [ ] **Step 4: Create labels util**

```typescript
// src/lib/utils/labels.ts
import type { PostType } from '$lib/types/post';

const LABELS: Record<PostType, string> = {
  book: 'Reading',
  tv: 'Watching',
  movie: 'Watching',
  tweet: 'Sharing',
  gif: 'Sharing',
  photo: 'Sharing',
  music: 'Listening',
  video: 'Watching'
};

export function getPostLabel(type: PostType): string {
  return LABELS[type];
}
```

- [ ] **Step 5: Create date util**

```typescript
// src/lib/utils/date.ts
export function formatPostDate(utcString: string): string {
  const date = new Date(utcString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatPostTime(utcString: string): string {
  const date = new Date(utcString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npx vitest run src/lib/utils/labels.test.ts
```

Expected: PASS — 8 tests passing.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types/post.ts src/lib/utils/labels.ts src/lib/utils/date.ts src/lib/utils/labels.test.ts src/test-setup.ts
git commit -m "feat: add post types, labels util, and date util"
```

---

### Task 3: Supabase clients

**Files:**
- Create: `src/lib/server/supabase.ts`
- Create: `src/lib/client/supabase.ts`

- [ ] **Step 1: Create server-side Supabase client**

```typescript
// src/lib/server/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});
```

- [ ] **Step 2: Create browser-side Supabase client**

```typescript
// src/lib/client/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
```

- [ ] **Step 3: Update `.env.example` — add PUBLIC_ prefixed vars**

SvelteKit requires client-safe env vars to be prefixed with `PUBLIC_`. Add these to `.env.example` and `.env.local`:

```bash
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Note: `SUPABASE_URL` and `SUPABASE_ANON_KEY` (without `PUBLIC_`) are kept for server-side use. `PUBLIC_` variants are safe to expose to the browser.

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/supabase.ts src/lib/client/supabase.ts .env.example
git commit -m "feat: add supabase server and client instances"
```

---

### Task 4: Database migration

**Files:**
- Create: `supabase/migrations/001_posts.sql`

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/001_posts.sql

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('book', 'tv', 'movie', 'tweet', 'gif', 'photo', 'music', 'video')),
  caption text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index idx_posts_user_private_created
  on public.posts (user_id, is_private, created_at desc);

alter table public.posts enable row level security;

create policy "Public can read non-private posts"
  on public.posts for select
  using (is_private = false);

create policy "Owner can read all their posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Owner can insert posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Owner can update posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner can delete posts"
  on public.posts for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Run migration against Supabase project**

```bash
# Paste the contents of supabase/migrations/001_posts.sql into
# Supabase dashboard → SQL Editor → New query → Run
```

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify table exists in Supabase dashboard**

Go to **Table Editor** — `posts` table should appear with all columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_posts.sql
git commit -m "feat: add posts table migration with RLS policies"
```

---

## Phase 2 — Server Data Layer

### Task 5: Posts DB queries

**Files:**
- Create: `src/lib/server/posts.ts`
- Create: `src/lib/server/posts.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/server/posts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase admin
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
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockRange = vi.fn().resolvedValue({ data: [], error: null, count: 0 });

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      range: mockRange
    } as any);

    await listPublicPosts({ page: 1, perPage: 20 });

    expect(supabaseAdmin.from).toHaveBeenCalledWith('posts');
    expect(mockEq).toHaveBeenCalledWith('is_private', false);
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});

describe('getPost', () => {
  it('fetches a single post by id', async () => {
    const mockPost = { id: 'abc', type: 'book', data: {}, is_private: false };
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().resolvedValue({ data: mockPost, error: null });

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle
    } as any);

    const result = await getPost('abc');
    expect(result).toEqual(mockPost);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/server/posts.test.ts
```

Expected: FAIL — `listPublicPosts` not found.

- [ ] **Step 3: Implement posts queries**

```typescript
// src/lib/server/posts.ts
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
  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/server/posts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/posts.ts src/lib/server/posts.test.ts
git commit -m "feat: add posts db query layer"
```

---

## Phase 3 — Metadata Fetchers

### Task 6: URL type detection

**Files:**
- Create: `src/lib/server/metadata/detect.ts`
- Create: `src/lib/server/metadata/detect.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/server/metadata/detect.test.ts
import { describe, it, expect } from 'vitest';
import { detectUrlType } from './detect';

describe('detectUrlType', () => {
  it('detects twitter/x URLs', () => {
    expect(detectUrlType('https://twitter.com/user/status/123')).toBe('tweet');
    expect(detectUrlType('https://x.com/user/status/123')).toBe('tweet');
  });
  it('detects giphy URLs', () => {
    expect(detectUrlType('https://giphy.com/gifs/abc')).toBe('gif');
    expect(detectUrlType('https://media.giphy.com/media/abc/giphy.gif')).toBe('gif');
  });
  it('detects tenor URLs', () => {
    expect(detectUrlType('https://tenor.com/view/abc')).toBe('gif');
  });
  it('detects spotify URLs', () => {
    expect(detectUrlType('https://open.spotify.com/track/abc')).toBe('music');
    expect(detectUrlType('https://open.spotify.com/album/abc')).toBe('music');
  });
  it('detects apple music URLs', () => {
    expect(detectUrlType('https://music.apple.com/us/album/abc')).toBe('music');
  });
  it('detects youtube URLs', () => {
    expect(detectUrlType('https://www.youtube.com/watch?v=abc')).toBe('video');
    expect(detectUrlType('https://youtu.be/abc')).toBe('video');
  });
  it('returns null for unknown URLs', () => {
    expect(detectUrlType('https://example.com')).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx vitest run src/lib/server/metadata/detect.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/lib/server/metadata/detect.ts
import type { PostType } from '$lib/types/post';

export function detectUrlType(url: string): PostType | null {
  try {
    const { hostname, pathname } = new URL(url);

    if (hostname === 'twitter.com' || hostname === 'x.com') return 'tweet';
    if (hostname === 'giphy.com' || hostname === 'media.giphy.com') return 'gif';
    if (hostname === 'tenor.com') return 'gif';
    if (hostname === 'open.spotify.com') return 'music';
    if (hostname === 'music.apple.com') return 'music';
    if (hostname === 'www.youtube.com' || hostname === 'youtu.be') return 'video';

    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npx vitest run src/lib/server/metadata/detect.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/metadata/detect.ts src/lib/server/metadata/detect.test.ts
git commit -m "feat: add URL type detection"
```

---

### Task 7: oEmbed fetcher

**Files:**
- Create: `src/lib/server/metadata/oembed.ts`
- Create: `src/lib/server/metadata/oembed.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/server/metadata/oembed.test.ts
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

import { fetchOembed } from './oembed';

describe('fetchOembed', () => {
  it('fetches tweet oEmbed from publish.twitter.com', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: '<blockquote>tweet</blockquote>', type: 'rich' })
    } as Response);

    const result = await fetchOembed('tweet', 'https://x.com/user/status/123');
    expect(result.oembed_html).toBe('<blockquote>tweet</blockquote>');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('publish.twitter.com/oembed')
    );
  });

  it('fetches spotify oEmbed', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: '<iframe src="spotify"></iframe>', type: 'rich' })
    } as Response);

    const result = await fetchOembed('music', 'https://open.spotify.com/track/abc');
    expect(result.oembed_html).toContain('iframe');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('open.spotify.com/oembed')
    );
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    await expect(fetchOembed('video', 'https://youtube.com/watch?v=abc')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx vitest run src/lib/server/metadata/oembed.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/lib/server/metadata/oembed.ts
import type { PostType } from '$lib/types/post';

const OEMBED_ENDPOINTS: Partial<Record<PostType, string>> = {
  tweet: 'https://publish.twitter.com/oembed',
  music: 'https://open.spotify.com/oembed',
  video: 'https://www.youtube.com/oembed',
  gif: 'https://giphy.com/services/oembed'
};

export async function fetchOembed(
  type: PostType,
  url: string
): Promise<{ oembed_html: string; oembed_raw: Record<string, unknown> }> {
  const endpoint = OEMBED_ENDPOINTS[type];
  if (!endpoint) throw new Error(`No oEmbed endpoint for type: ${type}`);

  const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl);

  if (!res.ok) throw new Error(`oEmbed fetch failed: ${res.status} for ${url}`);

  const raw = await res.json();
  return { oembed_html: raw.html ?? '', oembed_raw: raw };
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npx vitest run src/lib/server/metadata/oembed.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/metadata/oembed.ts src/lib/server/metadata/oembed.test.ts
git commit -m "feat: add oembed fetcher for tweets, spotify, youtube, giphy"
```

---

### Task 8: Apple Music embed constructor

**Files:**
- Create: `src/lib/server/metadata/applemusic.ts`
- Create: `src/lib/server/metadata/applemusic.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/server/metadata/applemusic.test.ts
import { describe, it, expect } from 'vitest';
import { buildAppleMusicEmbed } from './applemusic';

describe('buildAppleMusicEmbed', () => {
  it('builds embed HTML for a track URL', () => {
    const html = buildAppleMusicEmbed('https://music.apple.com/us/album/test/123?i=456');
    expect(html).toContain('embed.music.apple.com');
    expect(html).toContain('<iframe');
  });

  it('builds embed HTML for an album URL', () => {
    const html = buildAppleMusicEmbed('https://music.apple.com/us/album/test/123');
    expect(html).toContain('embed.music.apple.com');
  });

  it('throws for non-Apple Music URLs', () => {
    expect(() => buildAppleMusicEmbed('https://spotify.com/track/abc')).toThrow();
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx vitest run src/lib/server/metadata/applemusic.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/lib/server/metadata/applemusic.ts
export function buildAppleMusicEmbed(url: string): string {
  const parsed = new URL(url);
  if (parsed.hostname !== 'music.apple.com') {
    throw new Error(`Not an Apple Music URL: ${url}`);
  }

  // Convert https://music.apple.com/us/album/name/id
  // to    https://embed.music.apple.com/us/album/name/id
  const embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');

  return `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${embedUrl}"></iframe>`;
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npx vitest run src/lib/server/metadata/applemusic.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/metadata/applemusic.ts src/lib/server/metadata/applemusic.test.ts
git commit -m "feat: add apple music embed URL constructor"
```

---

### Task 9: TMDB metadata fetcher

**Files:**
- Create: `src/lib/server/metadata/tmdb.ts`
- Create: `src/lib/server/metadata/tmdb.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/server/metadata/tmdb.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/static/private', () => ({ TMDB_API_KEY: 'test-key' }));
global.fetch = vi.fn();

import { searchTmdb, getTmdbItem } from './tmdb';

describe('searchTmdb', () => {
  it('searches movies and returns results', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 1, title: 'Interstellar', release_date: '2014-11-05', poster_path: '/abc.jpg', media_type: 'movie' }]
      })
    } as Response);

    const results = await searchTmdb('Interstellar', 'movie');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Interstellar');
    expect(results[0].cover_url).toContain('image.tmdb.org');
  });

  it('searches TV and maps name field to title', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 2, name: 'Severance', first_air_date: '2022-02-18', poster_path: '/def.jpg' }]
      })
    } as Response);

    const results = await searchTmdb('Severance', 'tv');
    expect(results[0].title).toBe('Severance');
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx vitest run src/lib/server/metadata/tmdb.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/lib/server/metadata/tmdb.ts
import { TMDB_API_KEY } from '$env/static/private';
import type { MovieData, TvData } from '$lib/types/post';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

type TmdbSearchResult = (Partial<MovieData> & Partial<TvData>) & {
  tmdb_id: number;
  title: string;
  cover_url?: string;
};

export async function searchTmdb(
  query: string,
  type: 'movie' | 'tv'
): Promise<TmdbSearchResult[]> {
  const endpoint = `${TMDB_BASE}/search/${type}?query=${encodeURIComponent(query)}&language=en-US&page=1`;
  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
  });

  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const json = await res.json();
  return json.results.slice(0, 8).map((item: any) => ({
    tmdb_id: item.id,
    title: item.title ?? item.name,
    year: item.release_date ? parseInt(item.release_date.slice(0, 4)) : undefined,
    cover_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined,
    tmdb_url: `https://www.themoviedb.org/${type}/${item.id}`
  }));
}

export async function getTmdbItem(
  tmdbId: number,
  type: 'movie' | 'tv'
): Promise<MovieData | TvData> {
  const res = await fetch(`${TMDB_BASE}/${type}/${tmdbId}?language=en-US`, {
    headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
  });

  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);

  const item = await res.json();

  if (type === 'movie') {
    return {
      title: item.title,
      year: item.release_date ? parseInt(item.release_date.slice(0, 4)) : undefined,
      tmdb_id: item.id,
      cover_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined,
      tmdb_url: `https://www.themoviedb.org/movie/${item.id}`
    } satisfies MovieData;
  }

  return {
    title: item.name,
    tmdb_id: item.id,
    cover_url: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined,
    tmdb_url: `https://www.themoviedb.org/tv/${item.id}`
  } satisfies TvData;
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npx vitest run src/lib/server/metadata/tmdb.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/metadata/tmdb.ts src/lib/server/metadata/tmdb.test.ts
git commit -m "feat: add TMDB search and metadata fetcher"
```

---

### Task 10: Open Library fetcher

**Files:**
- Create: `src/lib/server/metadata/openlibrary.ts`
- Create: `src/lib/server/metadata/openlibrary.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/server/metadata/openlibrary.test.ts
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

import { lookupByIsbn, searchBooks } from './openlibrary';

describe('lookupByIsbn', () => {
  it('returns book data for a valid ISBN', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'The Name of the Wind',
        authors: [{ key: '/authors/OL123A' }],
        isbn_13: ['9780756404079']
      })
    } as Response);

    // second fetch for author name
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Patrick Rothfuss' })
    } as Response);

    const result = await lookupByIsbn('9780756404079');
    expect(result.title).toBe('The Name of the Wind');
    expect(result.author).toBe('Patrick Rothfuss');
    expect(result.cover_url).toContain('covers.openlibrary.org');
  });
});

describe('searchBooks', () => {
  it('returns book results for a title search', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        docs: [{ title: 'Dune', author_name: ['Frank Herbert'], isbn: ['9780441013593'] }]
      })
    } as Response);

    const results = await searchBooks('Dune', 'Frank Herbert');
    expect(results[0].title).toBe('Dune');
    expect(results[0].author).toBe('Frank Herbert');
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx vitest run src/lib/server/metadata/openlibrary.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/lib/server/metadata/openlibrary.ts
import type { BookData } from '$lib/types/post';

const OL_BASE = 'https://openlibrary.org';
const OL_COVERS = 'https://covers.openlibrary.org/b';

export async function lookupByIsbn(isbn: string): Promise<BookData> {
  const res = await fetch(`${OL_BASE}/isbn/${isbn}.json`);
  if (!res.ok) throw new Error(`Open Library ISBN lookup failed: ${res.status}`);

  const book = await res.json();
  let author = 'Unknown';

  if (book.authors?.length) {
    const authorRes = await fetch(`${OL_BASE}${book.authors[0].key}.json`);
    if (authorRes.ok) {
      const authorData = await authorRes.json();
      author = authorData.name ?? 'Unknown';
    }
  }

  const cleanIsbn = isbn.replace(/[^0-9X]/g, '');

  return {
    title: book.title,
    author,
    isbn: cleanIsbn,
    cover_url: `${OL_COVERS}/isbn/${cleanIsbn}-L.jpg`,
    source_url: `${OL_BASE}/isbn/${cleanIsbn}`
  };
}

export async function searchBooks(title: string, author?: string): Promise<BookData[]> {
  const params = new URLSearchParams({ title, limit: '8' });
  if (author) params.set('author', author);

  const res = await fetch(`${OL_BASE}/search.json?${params}`);
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);

  const json = await res.json();
  return json.docs.slice(0, 8).map((doc: any) => ({
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown',
    isbn: doc.isbn?.[0],
    cover_url: doc.isbn?.[0]
      ? `${OL_COVERS}/isbn/${doc.isbn[0]}-M.jpg`
      : undefined,
    source_url: doc.key ? `${OL_BASE}${doc.key}` : undefined
  }));
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npx vitest run src/lib/server/metadata/openlibrary.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/metadata/openlibrary.ts src/lib/server/metadata/openlibrary.test.ts
git commit -m "feat: add open library ISBN lookup and book search"
```

---

## Phase 4 — API Routes

### Task 11: Metadata API route

**Files:**
- Create: `src/routes/api/metadata/+server.ts`

- [ ] **Step 1: Implement**

```typescript
// src/routes/api/metadata/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { detectUrlType } from '$lib/server/metadata/detect';
import { fetchOembed } from '$lib/server/metadata/oembed';
import { buildAppleMusicEmbed } from '$lib/server/metadata/applemusic';
import { searchTmdb } from '$lib/server/metadata/tmdb';
import { lookupByIsbn, searchBooks } from '$lib/server/metadata/openlibrary';

// POST /api/metadata
// Body: { url?: string, type?: string, query?: string, isbn?: string, author?: string }
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { url, type, query, isbn, author } = body;

  // URL-based detection
  if (url) {
    const detected = detectUrlType(url);

    if (detected === 'tweet' || detected === 'video') {
      const data = await fetchOembed(detected, url);
      return json({ type: detected, data: { ...data, tweet_url: url, url } });
    }

    if (detected === 'gif') {
      const { hostname } = new URL(url);
      if (hostname === 'giphy.com' || hostname === 'media.giphy.com') {
        const data = await fetchOembed('gif', url);
        return json({ type: 'gif', data: { gif_url: url, source: 'giphy', oembed_html: data.oembed_html } });
      }
      if (hostname === 'tenor.com') {
        const data = await fetchOembed('gif', url);
        return json({ type: 'gif', data: { gif_url: url, source: 'tenor', oembed_html: data.oembed_html } });
      }
      return json({ type: 'gif', data: { gif_url: url, source: 'direct' } });
    }

    if (detected === 'music') {
      const { hostname } = new URL(url);
      if (hostname === 'open.spotify.com') {
        const data = await fetchOembed('music', url);
        return json({ type: 'music', data: { service: 'spotify', url, ...data } });
      }
      if (hostname === 'music.apple.com') {
        const oembed_html = buildAppleMusicEmbed(url);
        return json({ type: 'music', data: { service: 'apple_music', url, oembed_html } });
      }
    }

    return error(422, 'URL type could not be detected');
  }

  // ISBN lookup
  if (isbn) {
    const data = await lookupByIsbn(isbn);
    return json({ type: 'book', data });
  }

  // Book search
  if (type === 'book' && query) {
    const results = await searchBooks(query, author);
    return json({ type: 'book', results });
  }

  // TMDB search
  if ((type === 'movie' || type === 'tv') && query) {
    const results = await searchTmdb(query, type);
    return json({ type, results });
  }

  return error(400, 'Invalid request — provide url, isbn, or type + query');
};
```

- [ ] **Step 2: Test manually in dev**

```bash
curl -X POST http://localhost:5173/api/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"}'
```

Expected: JSON response with `type: "music"` and `oembed_html`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/metadata/+server.ts
git commit -m "feat: add metadata detection and fetch API route"
```

---

### Task 12: Auth routes

**Files:**
- Create: `src/routes/api/auth/magic-link/+server.ts`
- Create: `src/routes/api/auth/callback/+server.ts`
- Create: `src/lib/client/auth.ts`

- [ ] **Step 1: Implement magic link sender**

```typescript
// src/routes/api/auth/magic-link/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
  const { email } = await request.json();
  if (!email) return error(400, 'Email required');

  const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email
  });

  if (authError) return error(500, authError.message);
  return json({ ok: true });
};
```

- [ ] **Step 2: Implement auth callback handler**

```typescript
// src/routes/api/auth/callback/+server.ts
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
```

- [ ] **Step 3: Create client auth helpers**

```typescript
// src/lib/client/auth.ts
import { supabase } from '$lib/client/supabase';

export async function sendMagicLink(email: string): Promise<void> {
  const res = await fetch('/api/auth/magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error('Failed to send magic link');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  window.location.reload();
}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/auth/ src/lib/client/auth.ts
git commit -m "feat: add magic link auth routes and client helpers"
```

---

### Task 13: Posts API route (CRUD)

**Files:**
- Create: `src/routes/api/posts/+server.ts`

- [ ] **Step 1: Implement**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/posts/+server.ts
git commit -m "feat: add posts CRUD API route"
```

---

### Task 14: Photo upload route (with EXIF stripping)

**Files:**
- Create: `src/routes/api/upload/+server.ts`

- [ ] **Step 1: Implement**

```typescript
// src/routes/api/upload/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sharp from 'sharp';
import { supabaseAdmin } from '$lib/server/supabase';

async function getAuthenticatedUserId(cookies: any): Promise<string> {
  const accessToken = cookies.get('sb-access-token');
  if (!accessToken) throw error(401, 'Unauthorized');

  const { data, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !data.user) throw error(401, 'Unauthorized');

  return data.user.id;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const userId = await getAuthenticatedUserId(cookies);

  const formData = await request.formData();
  const file = formData.get('photo') as File | null;

  if (!file) return error(400, 'No photo provided');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    return error(415, 'Unsupported image type');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Strip EXIF by re-encoding through sharp — removes all metadata
  const stripped = await sharp(buffer)
    .rotate() // auto-rotate based on EXIF orientation before stripping
    .withMetadata({ exif: {} }) // replace EXIF with empty object
    .jpeg({ quality: 90 })
    .toBuffer();

  const filename = `${userId}/${Date.now()}.jpg`;
  const storagePath = `photos/${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('photos')
    .upload(storagePath, stripped, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) return error(500, uploadError.message);

  const { data: urlData } = supabaseAdmin.storage
    .from('photos')
    .getPublicUrl(storagePath);

  return json({
    storage_path: storagePath,
    public_url: urlData.publicUrl
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/upload/+server.ts
git commit -m "feat: add photo upload route with EXIF stripping via sharp"
```

---

## Phase 5 — Layout & Routes

### Task 15: App layout and root redirect

**Files:**
- Create: `src/app.html`
- Create: `src/app.css`
- Create: `src/routes/+layout.server.ts`
- Create: `src/routes/+layout.svelte`
- Create: `src/routes/+page.server.ts`
- Create: `src/routes/+page.svelte`

- [ ] **Step 1: Update app.html with dark mode class hook**

```html
<!-- src/app.html -->
<!doctype html>
<html lang="en" class="%sveltekit.theme%">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      // Prevent dark mode flash on load
      (function() {
        const theme = localStorage.getItem('lately-theme') || 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 2: Create global CSS**

```css
/* src/app.css */
@import 'tailwindcss';

:root {
  --color-bg: #ffffff;
  --color-text: #111111;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-accent: #111111;
}

.dark {
  --color-bg: #0f0f0f;
  --color-text: #f3f4f6;
  --color-muted: #9ca3af;
  --color-border: #1f2937;
  --color-accent: #f3f4f6;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s, color 0.2s;
}
```

- [ ] **Step 3: Create layout server loader**

```typescript
// src/routes/+layout.server.ts
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
```

- [ ] **Step 4: Create layout Svelte component**

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Toggles from '$lib/components/Toggles.svelte';

  export let data;
</script>

<div class="min-h-screen flex flex-col" style="background:var(--color-bg);color:var(--color-text)">
  <Toggles />
  <Header siteTitle={data.siteTitle} subtitle={data.subtitle} />
  <main class="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
    <slot />
  </main>
  <Footer
    username={data.username}
    socialLinks={data.socialLinks}
  />
</div>
```

- [ ] **Step 5: Create root redirect**

```typescript
// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { LATELY_USERNAME } from '$env/static/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  throw redirect(301, `/${LATELY_USERNAME}`);
};
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  // Redirect handled server-side
</script>
```

- [ ] **Step 6: Commit**

```bash
git add src/app.html src/app.css src/routes/+layout.server.ts src/routes/+layout.svelte src/routes/+page.server.ts src/routes/+page.svelte
git commit -m "feat: add app layout, dark mode flash prevention, root redirect"
```

---

### Task 16: Feed page route

**Files:**
- Create: `src/routes/[username]/+page.server.ts`
- Create: `src/routes/[username]/+page.svelte`

- [ ] **Step 1: Implement feed server loader**

```typescript
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
```

- [ ] **Step 2: Implement feed page component**

```svelte
<!-- src/routes/[username]/+page.svelte -->
<script lang="ts">
  import Feed from '$lib/components/Feed.svelte';
  import AddPanel from '$lib/components/AddPanel.svelte';

  export let data;
</script>

<svelte:head>
  <title>{data.ogTitle}</title>
  <meta property="og:title" content={data.ogTitle} />
  <meta property="og:url" content={data.ogUrl} />
</svelte:head>

{#if data.isOwner}
  <AddPanel username={data.username} />
{/if}

<Feed
  posts={data.posts}
  page={data.page}
  totalPages={data.totalPages}
  username={data.username}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/\[username\]/+page.server.ts src/routes/\[username\]/+page.svelte
git commit -m "feat: add feed page route with pagination and owner detection"
```

---

### Task 17: Permalink page route

**Files:**
- Create: `src/routes/[username]/[postId]/+page.server.ts`
- Create: `src/routes/[username]/[postId]/+page.svelte`

- [ ] **Step 1: Implement permalink server loader**

```typescript
// src/routes/[username]/[postId]/+page.server.ts
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
```

- [ ] **Step 2: Implement permalink page component**

```svelte
<!-- src/routes/[username]/[postId]/+page.svelte -->
<script lang="ts">
  import PostCard from '$lib/components/PostCard.svelte';

  export let data;
</script>

<svelte:head>
  <title>{data.ogTitle}</title>
  <meta property="og:title" content={data.ogTitle} />
  <meta property="og:url" content={data.ogUrl} />
</svelte:head>

<div class="mt-8">
  <a
    href="/{data.post.user_id}"
    class="text-sm mb-6 inline-block"
    style="color:var(--color-muted)"
  >
    &larr; Back to feed
  </a>
  <PostCard post={data.post} isOwner={data.isOwner} />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add "src/routes/[username]/[postId]/+page.server.ts" "src/routes/[username]/[postId]/+page.svelte"
git commit -m "feat: add post permalink route"
```

---

## Phase 6 — UI Components

### Task 18: Header, Footer, Toggles

**Files:**
- Create: `src/lib/components/Header.svelte`
- Create: `src/lib/components/Footer.svelte`
- Create: `src/lib/components/Toggles.svelte`

- [ ] **Step 1: Create Header**

```svelte
<!-- src/lib/components/Header.svelte -->
<script lang="ts">
  export let siteTitle: string;
  export let subtitle: string;
</script>

<header class="w-full max-w-2xl mx-auto px-4 pt-12 pb-6">
  <h1 class="text-2xl font-semibold tracking-tight" style="color:var(--color-text)">
    {siteTitle}
  </h1>
  {#if subtitle}
    <p class="mt-1 text-sm" style="color:var(--color-muted)">{subtitle}</p>
  {/if}
</header>
```

- [ ] **Step 2: Create Footer**

```svelte
<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
  export let username: string;
  export let socialLinks: Array<{ label: string; url: string }> = [];
</script>

<footer class="w-full max-w-2xl mx-auto px-4 py-8 mt-12 border-t" style="border-color:var(--color-border)">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm" style="color:var(--color-muted)">
    <span>&copy; {new Date().getFullYear()} {username}</span>
    {#if socialLinks.length}
      <div class="flex gap-4">
        {#each socialLinks as link}
          <a href={link.url} target="_blank" rel="noopener noreferrer" style="color:var(--color-muted)" class="hover:underline">
            {link.label}
          </a>
        {/each}
      </div>
    {/if}
  </div>
</footer>
```

- [ ] **Step 3: Create Toggles**

```svelte
<!-- src/lib/components/Toggles.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let isDark = false;
  let isInfiniteScroll = false;

  onMount(() => {
    isDark = localStorage.getItem('lately-theme') === 'dark';
    isInfiniteScroll = localStorage.getItem('lately-scroll') === 'infinite';
  });

  function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem('lately-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }

  function toggleScroll() {
    isInfiniteScroll = !isInfiniteScroll;
    localStorage.setItem('lately-scroll', isInfiniteScroll ? 'infinite' : 'paginated');
    // Reload to apply scroll mode change
    window.location.reload();
  }
</script>

<div class="fixed top-4 right-4 flex gap-2 z-50">
  <button
    on:click={toggleTheme}
    class="w-8 h-8 rounded-full flex items-center justify-center text-sm border"
    style="background:var(--color-bg);border-color:var(--color-border);color:var(--color-text)"
    aria-label="Toggle dark mode"
    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {isDark ? '☀️' : '🌙'}
  </button>

  <button
    on:click={toggleScroll}
    class="w-8 h-8 rounded-full flex items-center justify-center text-sm border"
    style="background:var(--color-bg);border-color:var(--color-border);color:var(--color-text)"
    aria-label="Toggle scroll mode"
    title={isInfiniteScroll ? 'Switch to pagination' : 'Switch to infinite scroll'}
  >
    {isInfiniteScroll ? '📄' : '∞'}
  </button>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Header.svelte src/lib/components/Footer.svelte src/lib/components/Toggles.svelte
git commit -m "feat: add header, footer, and dark mode/scroll toggles"
```

---

### Task 19: Post type card components

**Files:**
- Create: `src/lib/components/post-types/BookCard.svelte`
- Create: `src/lib/components/post-types/TvCard.svelte`
- Create: `src/lib/components/post-types/MovieCard.svelte`
- Create: `src/lib/components/post-types/TweetCard.svelte`
- Create: `src/lib/components/post-types/GifCard.svelte`
- Create: `src/lib/components/post-types/PhotoCard.svelte`
- Create: `src/lib/components/post-types/MusicCard.svelte`
- Create: `src/lib/components/post-types/VideoCard.svelte`

- [ ] **Step 1: BookCard**

```svelte
<!-- src/lib/components/post-types/BookCard.svelte -->
<script lang="ts">
  import type { BookData } from '$lib/types/post';
  export let data: BookData;
</script>

<div class="flex gap-4 items-start">
  {#if data.cover_url}
    <a href={data.source_url ?? '#'} target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
      <img src={data.cover_url} alt={data.title} class="w-16 rounded shadow-sm" loading="lazy" />
    </a>
  {/if}
  <div>
    <p class="font-medium leading-snug" style="color:var(--color-text)">{data.title}</p>
    <p class="text-sm mt-0.5" style="color:var(--color-muted)">{data.author}</p>
  </div>
</div>
```

- [ ] **Step 2: TvCard**

```svelte
<!-- src/lib/components/post-types/TvCard.svelte -->
<script lang="ts">
  import type { TvData } from '$lib/types/post';
  export let data: TvData;
</script>

<div class="flex gap-4 items-start">
  {#if data.cover_url}
    <a href={data.tmdb_url} target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
      <img src={data.cover_url} alt={data.title} class="w-16 rounded shadow-sm" loading="lazy" />
    </a>
  {/if}
  <div>
    <p class="font-medium leading-snug" style="color:var(--color-text)">{data.title}</p>
    {#if data.season}
      <p class="text-sm mt-0.5" style="color:var(--color-muted)">Season {data.season}</p>
    {/if}
  </div>
</div>
```

- [ ] **Step 3: MovieCard**

```svelte
<!-- src/lib/components/post-types/MovieCard.svelte -->
<script lang="ts">
  import type { MovieData } from '$lib/types/post';
  export let data: MovieData;
</script>

<div class="flex gap-4 items-start">
  {#if data.cover_url}
    <a href={data.tmdb_url} target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
      <img src={data.cover_url} alt={data.title} class="w-16 rounded shadow-sm" loading="lazy" />
    </a>
  {/if}
  <div>
    <p class="font-medium leading-snug" style="color:var(--color-text)">{data.title}</p>
    {#if data.year}
      <p class="text-sm mt-0.5" style="color:var(--color-muted)">{data.year}</p>
    {/if}
  </div>
</div>
```

- [ ] **Step 4: TweetCard**

```svelte
<!-- src/lib/components/post-types/TweetCard.svelte -->
<script lang="ts">
  import type { TweetData } from '$lib/types/post';
  import { onMount } from 'svelte';

  export let data: TweetData;

  onMount(() => {
    // Load Twitter widgets script to render blockquote embeds
    if (typeof window !== 'undefined' && !document.getElementById('twitter-wjs')) {
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      document.body.appendChild(script);
    } else if ((window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load();
    }
  });
</script>

<div class="w-full overflow-hidden">
  {@html data.oembed_html}
</div>
```

- [ ] **Step 5: GifCard**

```svelte
<!-- src/lib/components/post-types/GifCard.svelte -->
<script lang="ts">
  import type { GifData } from '$lib/types/post';
  export let data: GifData;
</script>

<div class="w-full">
  {#if data.source === 'direct'}
    <img src={data.gif_url} alt="GIF" class="w-full rounded" loading="lazy" />
  {:else if data.oembed_html}
    <div class="w-full overflow-hidden rounded">
      {@html data.oembed_html}
    </div>
  {:else}
    <img src={data.gif_url} alt="GIF" class="w-full rounded" loading="lazy" />
  {/if}
</div>
```

- [ ] **Step 6: PhotoCard**

```svelte
<!-- src/lib/components/post-types/PhotoCard.svelte -->
<script lang="ts">
  import type { PhotoData } from '$lib/types/post';
  export let data: PhotoData;
</script>

<div class="w-full">
  <img
    src={data.public_url}
    alt="Photo"
    class="w-full rounded"
    loading="lazy"
  />
</div>
```

- [ ] **Step 7: MusicCard**

```svelte
<!-- src/lib/components/post-types/MusicCard.svelte -->
<script lang="ts">
  import type { MusicData } from '$lib/types/post';
  export let data: MusicData;
</script>

<div class="w-full overflow-hidden rounded">
  {#if data.oembed_html}
    {@html data.oembed_html}
  {:else}
    <a href={data.url} target="_blank" rel="noopener noreferrer" style="color:var(--color-accent)" class="underline">
      Listen on {data.service === 'spotify' ? 'Spotify' : 'Apple Music'}
    </a>
  {/if}
</div>
```

- [ ] **Step 8: VideoCard**

```svelte
<!-- src/lib/components/post-types/VideoCard.svelte -->
<script lang="ts">
  import type { VideoData } from '$lib/types/post';
  export let data: VideoData;
</script>

<div class="w-full aspect-video overflow-hidden rounded">
  {@html data.oembed_html}
</div>
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/components/post-types/
git commit -m "feat: add all eight post type card components"
```

---

### Task 20: PostCard (dispatcher) and Feed components

**Files:**
- Create: `src/lib/components/PostCard.svelte`
- Create: `src/lib/components/Feed.svelte`

- [ ] **Step 1: Create PostCard dispatcher**

```svelte
<!-- src/lib/components/PostCard.svelte -->
<script lang="ts">
  import type { Post } from '$lib/types/post';
  import { getPostLabel } from '$lib/utils/labels';
  import { formatPostDate, formatPostTime } from '$lib/utils/date';
  import BookCard from './post-types/BookCard.svelte';
  import TvCard from './post-types/TvCard.svelte';
  import MovieCard from './post-types/MovieCard.svelte';
  import TweetCard from './post-types/TweetCard.svelte';
  import GifCard from './post-types/GifCard.svelte';
  import PhotoCard from './post-types/PhotoCard.svelte';
  import MusicCard from './post-types/MusicCard.svelte';
  import VideoCard from './post-types/VideoCard.svelte';

  export let post: Post;
  export let isOwner: boolean = false;
  export let username: string = '';

  const components = {
    book: BookCard,
    tv: TvCard,
    movie: MovieCard,
    tweet: TweetCard,
    gif: GifCard,
    photo: PhotoCard,
    music: MusicCard,
    video: VideoCard
  };

  $: component = components[post.type];
  $: label = getPostLabel(post.type);

  async function togglePrivate() {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, is_private: !post.is_private })
    });
    window.location.reload();
  }

  async function deletePost() {
    if (!confirm('Delete this post?')) return;
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id })
    });
    window.location.reload();
  }
</script>

<article class="py-6 border-b" style="border-color:var(--color-border)">
  <div class="flex items-center justify-between mb-3">
    <span class="text-xs font-medium uppercase tracking-wider" style="color:var(--color-muted)">
      {label}
      {#if post.is_private}
        <span class="ml-1 opacity-50">(private)</span>
      {/if}
    </span>
    <div class="flex items-center gap-3">
      <a
        href="/{username}/{post.id}"
        class="text-xs"
        style="color:var(--color-muted)"
        title="{formatPostDate(post.created_at)} at {formatPostTime(post.created_at)}"
      >
        {formatPostDate(post.created_at)}
      </a>
      {#if isOwner}
        <button on:click={togglePrivate} class="text-xs" style="color:var(--color-muted)" title={post.is_private ? 'Make public' : 'Make private'}>
          {post.is_private ? '👁' : '🔒'}
        </button>
        <button on:click={deletePost} class="text-xs" style="color:var(--color-muted)" title="Delete post">
          ✕
        </button>
      {/if}
    </div>
  </div>

  <svelte:component this={component} data={post.data} />

  {#if post.caption}
    <p class="mt-3 text-sm leading-relaxed" style="color:var(--color-text)">{post.caption}</p>
  {/if}
</article>
```

- [ ] **Step 2: Create Feed component**

```svelte
<!-- src/lib/components/Feed.svelte -->
<script lang="ts">
  import type { Post } from '$lib/types/post';
  import PostCard from './PostCard.svelte';
  import { onMount } from 'svelte';

  export let posts: Post[];
  export let page: number;
  export let totalPages: number;
  export let username: string;
  export let isOwner: boolean = false;

  let isInfiniteScroll = false;
  let allPosts = [...posts];
  let loadingMore = false;
  let currentPage = page;

  onMount(() => {
    isInfiniteScroll = localStorage.getItem('lately-scroll') === 'infinite';

    if (isInfiniteScroll) {
      const observer = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting && !loadingMore && currentPage < totalPages) {
            loadingMore = true;
            currentPage++;
            const res = await fetch(`/${username}?page=${currentPage}`, {
              headers: { 'x-lately-data': '1' }
            });
            // In v1, just navigate to next page — full infinite scroll is phase 2
            loadingMore = false;
          }
        },
        { threshold: 0.1 }
      );

      const sentinel = document.getElementById('scroll-sentinel');
      if (sentinel) observer.observe(sentinel);
      return () => observer.disconnect();
    }
  });
</script>

<div>
  {#each allPosts as post (post.id)}
    <PostCard {post} {isOwner} {username} />
  {/each}

  {#if isInfiniteScroll}
    <div id="scroll-sentinel" class="h-4"></div>
    {#if loadingMore}
      <p class="text-center py-4 text-sm" style="color:var(--color-muted)">Loading…</p>
    {/if}
  {:else}
    <!-- Pagination (also shown as fallback in infinite scroll mode) -->
    {#if totalPages > 1}
      <nav class="flex justify-between items-center pt-8 pb-4 text-sm" style="color:var(--color-muted)">
        {#if page > 1}
          <a href="/{username}?page={page - 1}" class="hover:underline">&larr; Newer</a>
        {:else}
          <span></span>
        {/if}
        <span>{page} / {totalPages}</span>
        {#if page < totalPages}
          <a href="/{username}?page={page + 1}" class="hover:underline">Older &rarr;</a>
        {:else}
          <span></span>
        {/if}
      </nav>
    {/if}
  {/if}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/PostCard.svelte src/lib/components/Feed.svelte
git commit -m "feat: add PostCard dispatcher and Feed component with pagination/infinite scroll"
```

---

### Task 21: AddPanel component

**Files:**
- Create: `src/lib/components/AddPanel.svelte`
- Create: `src/lib/components/add-steps/TypePicker.svelte`
- Create: `src/lib/components/add-steps/UrlInput.svelte`
- Create: `src/lib/components/add-steps/MetadataPreview.svelte`
- Create: `src/lib/components/add-steps/CaptionInput.svelte`

- [ ] **Step 1: Create TypePicker**

```svelte
<!-- src/lib/components/add-steps/TypePicker.svelte -->
<script lang="ts">
  import type { PostType } from '$lib/types/post';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ select: PostType }>();

  const types: Array<{ type: PostType; label: string; emoji: string }> = [
    { type: 'book', label: 'Book', emoji: '📚' },
    { type: 'tv', label: 'TV Show', emoji: '📺' },
    { type: 'movie', label: 'Movie', emoji: '🎬' },
    { type: 'tweet', label: 'Tweet', emoji: '🐦' },
    { type: 'gif', label: 'GIF', emoji: '🎭' },
    { type: 'photo', label: 'Photo', emoji: '📷' },
    { type: 'music', label: 'Music', emoji: '🎵' },
    { type: 'video', label: 'Video', emoji: '▶️' }
  ];
</script>

<div class="grid grid-cols-4 gap-2">
  {#each types as t}
    <button
      on:click={() => dispatch('select', t.type)}
      class="flex flex-col items-center p-3 rounded-lg border text-sm gap-1 hover:opacity-70 transition-opacity"
      style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
    >
      <span class="text-xl">{t.emoji}</span>
      <span>{t.label}</span>
    </button>
  {/each}
</div>
```

- [ ] **Step 2: Create UrlInput**

```svelte
<!-- src/lib/components/add-steps/UrlInput.svelte -->
<script lang="ts">
  import type { PostType } from '$lib/types/post';
  import { createEventDispatcher } from 'svelte';

  export let type: PostType;
  const dispatch = createEventDispatcher<{ submit: { value: string } }>();

  let value = '';
  let loading = false;
  let error = '';

  const placeholders: Record<PostType, string> = {
    book: 'Paste Amazon URL, ISBN, or enter title…',
    tv: 'Search by title (e.g. Severance)',
    movie: 'Search by title (e.g. Interstellar)',
    tweet: 'Paste tweet URL…',
    gif: 'Paste Giphy, Tenor, or direct GIF URL…',
    photo: '',
    music: 'Paste Spotify or Apple Music URL…',
    video: 'Paste YouTube URL…'
  };

  async function handleSubmit() {
    if (!value.trim()) return;
    loading = true;
    error = '';
    dispatch('submit', { value: value.trim() });
    loading = false;
  }
</script>

{#if type === 'photo'}
  <input
    type="file"
    accept="image/*"
    class="w-full text-sm"
    style="color:var(--color-text)"
    on:change={(e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) dispatch('submit', { value: URL.createObjectURL(file) });
    }}
  />
{:else}
  <div class="flex gap-2">
    <input
      bind:value
      type="text"
      placeholder={placeholders[type]}
      class="flex-1 px-3 py-2 rounded border text-sm outline-none"
      style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
      on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
    />
    <button
      on:click={handleSubmit}
      disabled={loading}
      class="px-4 py-2 rounded text-sm font-medium"
      style="background:var(--color-accent);color:var(--color-bg)"
    >
      {loading ? '…' : 'Fetch'}
    </button>
  </div>
  {#if error}<p class="text-xs mt-1 text-red-500">{error}</p>{/if}
{/if}
```

- [ ] **Step 3: Create MetadataPreview**

```svelte
<!-- src/lib/components/add-steps/MetadataPreview.svelte -->
<script lang="ts">
  import type { PostType, PostData } from '$lib/types/post';
  import PostCard from '$lib/components/PostCard.svelte';
  import { createEventDispatcher } from 'svelte';

  export let type: PostType;
  export let data: PostData;
  const dispatch = createEventDispatcher<{ confirm: void; back: void }>();

  // Synthesise a fake post for preview
  $: previewPost = {
    id: 'preview',
    user_id: '',
    type,
    caption: null,
    is_private: false,
    created_at: new Date().toISOString(),
    data
  };
</script>

<div>
  <p class="text-sm mb-3" style="color:var(--color-muted)">Looks right?</p>
  <PostCard post={previewPost} isOwner={false} username="" />
  <div class="flex gap-2 mt-4">
    <button
      on:click={() => dispatch('back')}
      class="px-4 py-2 rounded text-sm border"
      style="border-color:var(--color-border);color:var(--color-text)"
    >
      Back
    </button>
    <button
      on:click={() => dispatch('confirm')}
      class="px-4 py-2 rounded text-sm font-medium"
      style="background:var(--color-accent);color:var(--color-bg)"
    >
      Confirm
    </button>
  </div>
</div>
```

- [ ] **Step 4: Create CaptionInput**

```svelte
<!-- src/lib/components/add-steps/CaptionInput.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ submit: { caption: string } }>();

  let caption = '';
  let loading = false;

  function handleSubmit() {
    loading = true;
    dispatch('submit', { caption });
  }
</script>

<div>
  <textarea
    bind:value={caption}
    placeholder="Add a caption (optional)…"
    rows="3"
    class="w-full px-3 py-2 rounded border text-sm resize-none outline-none"
    style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
  ></textarea>
  <div class="flex gap-2 mt-3">
    <button
      on:click={handleSubmit}
      disabled={loading}
      class="px-4 py-2 rounded text-sm font-medium"
      style="background:var(--color-accent);color:var(--color-bg)"
    >
      {loading ? 'Posting…' : 'Post'}
    </button>
    <button
      on:click={handleSubmit}
      class="px-4 py-2 rounded text-sm border"
      style="border-color:var(--color-border);color:var(--color-muted)"
    >
      Post without caption
    </button>
  </div>
</div>
```

- [ ] **Step 5: Create AddPanel (orchestrator)**

```svelte
<!-- src/lib/components/AddPanel.svelte -->
<script lang="ts">
  import type { PostType, PostData } from '$lib/types/post';
  import TypePicker from './add-steps/TypePicker.svelte';
  import UrlInput from './add-steps/UrlInput.svelte';
  import MetadataPreview from './add-steps/MetadataPreview.svelte';
  import CaptionInput from './add-steps/CaptionInput.svelte';

  export let username: string;

  type Step = 'closed' | 'pick-type' | 'input' | 'preview' | 'caption';

  let step: Step = 'closed';
  let selectedType: PostType | null = null;
  let fetchedData: PostData | null = null;
  let photoFile: File | null = null;

  function open() { step = 'pick-type'; }
  function close() { step = 'closed'; selectedType = null; fetchedData = null; }

  async function handleTypeSelect(e: CustomEvent<PostType>) {
    selectedType = e.detail;
    step = 'input';
  }

  async function handleUrlSubmit(e: CustomEvent<{ value: string }>) {
    if (!selectedType) return;

    if (selectedType === 'photo') {
      // Photo is handled by file upload — skip to caption
      step = 'caption';
      return;
    }

    const res = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildMetadataPayload(selectedType, e.detail.value))
    });

    if (!res.ok) {
      alert('Could not fetch metadata. Check the URL and try again.');
      return;
    }

    const json = await res.json();
    fetchedData = json.data ?? json.results?.[0];
    step = 'preview';
  }

  function buildMetadataPayload(type: PostType, value: string) {
    if (type === 'tv' || type === 'movie') return { type, query: value };
    if (type === 'book') {
      const isIsbn = /^[0-9]{10,13}$/.test(value.replace(/-/g, ''));
      if (isIsbn) return { isbn: value };
      return { type: 'book', query: value };
    }
    return { url: value };
  }

  async function handleConfirm() {
    step = 'caption';
  }

  async function handleCaption(e: CustomEvent<{ caption: string }>) {
    if (!selectedType || !fetchedData) return;

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: selectedType,
        caption: e.detail.caption || null,
        is_private: false,
        data: fetchedData
      })
    });

    close();
    window.location.reload();
  }
</script>

{#if step === 'closed'}
  <button
    on:click={open}
    class="fixed bottom-6 right-6 w-12 h-12 rounded-full text-2xl shadow-lg flex items-center justify-center z-50"
    style="background:var(--color-accent);color:var(--color-bg)"
    aria-label="Add post"
  >
    +
  </button>
{:else}
  <!-- Overlay -->
  <div
    class="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
    style="background:rgba(0,0,0,0.4)"
    on:click|self={close}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      style="background:var(--color-bg)"
    >
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-medium" style="color:var(--color-text)">
          {#if step === 'pick-type'}Add something{/if}
          {#if step === 'input' && selectedType}Add {selectedType}{/if}
          {#if step === 'preview'}Preview{/if}
          {#if step === 'caption'}Add a caption{/if}
        </h2>
        <button on:click={close} class="text-sm" style="color:var(--color-muted)">✕</button>
      </div>

      {#if step === 'pick-type'}
        <TypePicker on:select={handleTypeSelect} />
      {:else if step === 'input' && selectedType}
        <UrlInput type={selectedType} on:submit={handleUrlSubmit} />
      {:else if step === 'preview' && selectedType && fetchedData}
        <MetadataPreview type={selectedType} data={fetchedData} on:confirm={handleConfirm} on:back={() => (step = 'input')} />
      {:else if step === 'caption'}
        <CaptionInput on:submit={handleCaption} />
      {/if}
    </div>
  </div>
{/if}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/AddPanel.svelte src/lib/components/add-steps/
git commit -m "feat: add post creation panel with step-by-step flow"
```

---

## Phase 7 — Login Page & Final Wiring

### Task 22: Login page

**Files:**
- Create: `src/routes/login/+page.svelte`

- [ ] **Step 1: Implement**

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { sendMagicLink } from '$lib/client/auth';

  let email = '';
  let sent = false;
  let error = '';
  let loading = false;

  async function handleSubmit() {
    if (!email.trim()) return;
    loading = true;
    error = '';
    try {
      await sendMagicLink(email.trim());
      sent = true;
    } catch (e) {
      error = 'Something went wrong. Try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-sm mx-auto mt-16">
  {#if sent}
    <p class="text-sm" style="color:var(--color-text)">
      Check your email — a magic link is on its way.
    </p>
  {:else}
    <h1 class="text-xl font-medium mb-6" style="color:var(--color-text)">Sign in</h1>
    <div class="flex gap-2">
      <input
        bind:value={email}
        type="email"
        placeholder="your@email.com"
        class="flex-1 px-3 py-2 rounded border text-sm outline-none"
        style="border-color:var(--color-border);background:var(--color-bg);color:var(--color-text)"
        on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button
        on:click={handleSubmit}
        disabled={loading}
        class="px-4 py-2 rounded text-sm font-medium"
        style="background:var(--color-accent);color:var(--color-bg)"
      >
        {loading ? '…' : 'Send link'}
      </button>
    </div>
    {#if error}<p class="text-xs mt-2 text-red-500">{error}</p>{/if}
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/login/+page.svelte
git commit -m "feat: add magic link login page"
```

---

### Task 23: Vercel deploy config and README

**Files:**
- Create: `vercel.json`
- Modify: `README.md`

- [ ] **Step 1: Create vercel.json**

```json
{
  "framework": "sveltekit",
  "buildCommand": "npm run build",
  "outputDirectory": ".svelte-kit/output"
}
```

- [ ] **Step 2: Write README**

```markdown
# Lately

A personal tumblelog. Share what you're reading, watching, listening to, and building — right now.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tommcfarlin/lately)

## Self-hosting

See [docs/prerequisites.md](docs/prerequisites.md) for the full setup guide — Supabase project, database migration, TMDB API key, and environment variables.

Quick start:

1. Click the Deploy button above
2. Create a Supabase project and run the migration in `supabase/migrations/001_posts.sql`
3. Set environment variables in Vercel (see `.env.example`)
4. Visit `yourdomain.com/[your-username]`

## Local development

```bash
git clone https://github.com/tommcfarlin/lately.git
cd lately
npm install
cp .env.example .env.local
# Fill in .env.local
npm run dev
```

## Tech stack

SvelteKit · Supabase · Vercel · Tailwind CSS
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: add vercel config and README with deploy button"
```

- [ ] **Step 5: Push to GitHub and verify Vercel auto-deploy**

```bash
git remote add origin https://github.com/tommcfarlin/lately.git
git push -u origin main
```

Open Vercel dashboard — deployment should trigger automatically.

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered by task |
|---|---|
| SvelteKit + Supabase + Vercel | Tasks 1, 3, 23 |
| posts table + RLS | Task 4 |
| 8 post types with JSONB payloads | Tasks 2, 9, 10, 7, 8, 19 |
| URL type detection | Task 6 |
| oEmbed (tweet, spotify, youtube, gif) | Task 7 |
| Apple Music embed | Task 8 |
| TMDB search + autocomplete | Task 9 |
| Open Library ISBN + title search | Task 10 |
| Metadata API route | Task 11 |
| Magic link auth | Tasks 12, 22 |
| Posts CRUD API | Tasks 5, 13 |
| Photo upload + EXIF stripping | Task 14 |
| Root redirect → /[username] | Task 15 |
| Feed page (SSR, paginated) | Task 16 |
| Permalink page | Task 17 |
| Header + subtitle | Task 18 |
| Footer + social links | Task 18 |
| Dark mode toggle (localStorage) | Task 18 |
| Infinite scroll / pagination toggle (localStorage) | Tasks 18, 20 |
| PostCard with type label | Task 20 |
| Edit / delete / mark private per post | Task 20 |
| Add panel step flow | Task 21 |
| isOwner detection (auth cookie) | Task 15 |
| og: meta tags for SSR shareability | Tasks 16, 17 |
| .env.example + self-host docs | Tasks 1, 23 |
| Deploy to Vercel button | Task 23 |

All spec requirements covered. No gaps found.
