# Lately — Prerequisites & Setup Checklist

Everything you need to have in place before writing a line of code.

---

## 1. Supabase

Lately uses Supabase for the database, auth, and photo storage.

### Create a project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, give the project a name (e.g., `lately`), set a strong database password, and pick the region closest to you
4. Wait for the project to provision (~2 minutes)

### Collect your credentials

From your project dashboard → **Settings → API**:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project URL (e.g., `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — keep this secret, server-side only |

### Run the database migration

In the Supabase dashboard → **SQL Editor**, run the following:

```sql
-- Posts table
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('book', 'tv', 'movie', 'tweet', 'gif', 'photo', 'music', 'video')),
  caption text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

-- Index for the public feed query (non-private posts, newest first)
create index idx_posts_user_private_created
  on public.posts (user_id, is_private, created_at desc);

-- Row-Level Security
alter table public.posts enable row level security;

-- Anyone can read non-private posts
create policy "Public can read non-private posts"
  on public.posts for select
  using (is_private = false);

-- Authenticated owner can read all their posts (including private)
create policy "Owner can read all their posts"
  on public.posts for select
  using (auth.uid() = user_id);

-- Authenticated owner can insert posts
create policy "Owner can insert posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- Authenticated owner can update their posts
create policy "Owner can update posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated owner can delete their posts
create policy "Owner can delete posts"
  on public.posts for delete
  using (auth.uid() = user_id);
```

### Create a storage bucket for photos

In the Supabase dashboard → **Storage**:

1. Click **New bucket**
2. Name it `photos`
3. Set it to **Public** (so photo URLs can be served without auth)
4. Under **Policies**, add a policy: authenticated users can insert into `photos/`; anyone can read from `photos/`

### Configure magic link auth

In **Authentication → Settings**:

1. Confirm that **Email** provider is enabled
2. Set **Site URL** to your Vercel deployment URL (or `http://localhost:5173` for local dev)
3. Add the same URL to **Redirect URLs**
4. Optionally configure a custom SMTP provider (Resend, Postmark, etc.) if you expect to exceed Supabase's free-tier email limits (4 emails/hour on free tier — fine for a single-user app)

---

## 2. TMDB (The Movie Database)

Used for movie and TV show metadata — titles, cover art, descriptions.

1. Create a free account at [themoviedb.org](https://www.themoviedb.org)
2. Go to **Settings → API** and request an API key (choose **Developer**, fill out the form — approval is instant)
3. Copy the **API Read Access Token** (the long Bearer token, not the v3 key)

| Variable | Value |
|---|---|
| `TMDB_API_KEY` | Your API Read Access Token |

No cost. No rate limit concerns at personal-project scale.

---

## 3. Open Library

Used for book metadata — cover art, author, title lookups by ISBN or title.

**No API key required.** Open Library's API is public and unauthenticated. No setup needed.

Relevant endpoints:
- ISBN lookup: `https://openlibrary.org/isbn/{isbn}.json`
- Search: `https://openlibrary.org/search.json?title={title}&author={author}`
- Cover art: `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg`

---

## 4. Vercel

Used for hosting the SvelteKit app.

1. Create a free account at [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. You'll import the Lately repo during the first deploy

No setup needed now — Vercel configuration happens when the repo is ready to deploy.

---

## 5. Environment Variables Summary

Collect these before starting local development. Add them to a `.env.local` file at the project root (this file is gitignored — never commit it).

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
LATELY_SOCIAL_LINKS=[{"label":"GitHub","url":"https://github.com/tommcfarlin"},{"label":"Website","url":"https://tommcfarlin.com"}]

# App
PUBLIC_BASE_URL=http://localhost:5173
```

When deploying to Vercel, these same variables go into **Project Settings → Environment Variables**.

---

## 6. Local Development

Once the above is in place:

```bash
git clone https://github.com/tommcfarlin/lately.git
cd lately
npm install
cp .env.example .env.local
# Fill in .env.local with your values from above
npm run dev
```

App runs at `http://localhost:5173`.
