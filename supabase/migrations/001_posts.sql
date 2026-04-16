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
