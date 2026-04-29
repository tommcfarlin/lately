-- supabase/migrations/001_posts.sql

-- Posts table
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in (
    'music', 'video', 'movie', 'tv', 'book',
    'quote', 'photo', 'link', 'podcast', 'social'
  )),
  caption text,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

-- Index for feed query (newest first)
create index idx_posts_created_at on public.posts (created_at desc);

-- Row-Level Security
alter table public.posts enable row level security;

create policy "Public can read posts"
  on public.posts for select
  using (true);

create policy "Owner can insert"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Owner can update"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner can delete"
  on public.posts for delete
  using (auth.uid() = user_id);
