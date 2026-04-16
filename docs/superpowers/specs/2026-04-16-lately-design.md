# Lately — Design Spec

**Date:** 2026-04-16
**Author:** Tom McFarlin <tom@tommcfarlin.com>
**Status:** Draft

---

## Overview

Lately is a personal tumblelog-style page for sharing what you're consuming and creating right now — books, shows, movies, music, videos, tweets, GIFs, photos. It's a single, shareable feed that answers the question "what are you into lately?" without the noise of a full blog or the social graph of Tumblr.

It is:
- Public but not promoted (no indexing, no SEO ambition)
- Single-user MVP, multi-user-ready architecture
- Self-hostable by others via a one-click Vercel + Supabase deploy
- A responsive web app that works on desktop and mobile with no native app required

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | SvelteKit | Lean output, SSR, excellent DX, Vercel-native |
| Database / Auth / Storage | Supabase | Postgres + RLS + Magic Link auth + file storage, free tier |
| Hosting | Vercel | Free tier, one-click deploy, zero-config SvelteKit support |
| Media metadata | TMDB API | Movies and TV — cover art, titles, metadata (free) |
| Book metadata | Open Library API | ISBN / title lookup — cover art, author, title (free) |
| Embeds | oEmbed | Tweets, Spotify, YouTube — standard embed protocol |
| Photo storage | Supabase Storage | File uploads from browser (desktop or mobile) |

---

## Architecture

```
Browser (SvelteKit SSR)
  └── Public feed:  /[username]                 (no auth, SSR, shareable)
  └── Post detail:  /[username]/[post-id]        (no auth, SSR, permalink)
  └── Admin view:   /[username] + add panel      (auth required, same layout)

SvelteKit server routes
  └── oEmbed fetching (tweets, Spotify, YouTube)
  └── TMDB search + metadata fetch
  └── Open Library search + metadata fetch
  └── Post CRUD (create, read, update, soft-delete / privacy toggle)

Supabase
  └── Postgres: posts table (see Data Model)
  └── Auth: Magic Link via email (no OAuth app setup required)
  └── Storage: photo uploads
  └── RLS: public read, authenticated write
```

**Username routing:** `/` redirects to `/[username]`. Username is set via environment variable (`LATELY_USERNAME`). Self-hosters set it once during setup. No settings UI needed for v1.

**SSR rationale:** The public feed is server-side rendered so link previews (iMessage, Twitter, Slack) work correctly — og:title, og:image, og:description are populated on the server before HTML is sent to the browser.

---

## Data Model

### `posts` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Foreign key → Supabase auth.users. Present from day one even though MVP is single-user. |
| `type` | `text` | Enum: `book`, `tv`, `movie`, `tweet`, `gif`, `photo`, `music`, `video` |
| `caption` | `text` | Optional. User-written text attached to any post type. |
| `is_private` | `boolean` | Default false. Private posts are hidden from the public feed but not deleted. |
| `created_at` | `timestamptz` | Stored in UTC. |
| `data` | `jsonb` | Type-specific payload (see below). |

### JSONB `data` payloads by type

**`book`**
```json
{
  "title": "The Name of the Wind",
  "author": "Patrick Rothfuss",
  "cover_url": "https://...",
  "isbn": "9780756404079",
  "source_url": "https://openlibrary.org/..."
}
```

**`tv`**
```json
{
  "title": "Severance",
  "season": 2,           // optional — omit if posting about a whole show
  "tmdb_id": 95396,
  "cover_url": "https://image.tmdb.org/...",
  "tmdb_url": "https://www.themoviedb.org/tv/95396"
}
```

**`movie`**
```json
{
  "title": "Interstellar",
  "year": 2014,
  "tmdb_id": 157336,
  "cover_url": "https://image.tmdb.org/...",
  "tmdb_url": "https://www.themoviedb.org/movie/157336"
}
```

**`tweet`**
```json
{
  "tweet_url": "https://x.com/...",
  "oembed_html": "<blockquote>...</blockquote>",
  "oembed_raw": { ... }
}
```
Note: The full oEmbed response is stored in `oembed_raw` as a fallback against content rot (tweets getting deleted or embeds breaking).

**`gif`**
```json
{
  "gif_url": "https://media.giphy.com/...",
  "source": "giphy",
  "oembed_html": "<iframe>...</iframe>"
}
```
Source is one of `giphy`, `tenor`, or `direct`. Giphy and Tenor both support oEmbed. Direct URLs render as `<img>`.

**`photo`**
```json
{
  "storage_path": "photos/[user_id]/[filename]",
  "public_url": "https://[supabase-project].supabase.co/storage/v1/object/public/..."
}
```
EXIF data must be stripped server-side before the image is written to Supabase Storage. This is a v1 requirement — location metadata embedded in phone photos must never be stored or served publicly.

**`music`**
```json
{
  "service": "spotify",
  "url": "https://open.spotify.com/track/...",
  "oembed_html": "<iframe>...</iframe>",
  "oembed_raw": { ... }
}
```
Service is `spotify` or `apple_music`. Spotify supports standard oEmbed at `open.spotify.com/oembed`. Apple Music does not — it uses a proprietary embed URL pattern. Both will be handled in v1, but Apple Music requires custom embed URL construction rather than oEmbed resolution.

**`video`**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "oembed_html": "<iframe>...</iframe>",
  "oembed_raw": { ... }
}
```

---

## Post Types — MVP

| Type | Input method | Metadata source |
|---|---|---|
| Book | Amazon URL or ISBN → auto-fetches metadata; or manual title + required author entry | Open Library API |
| TV show | Title autocomplete (episode or whole show) | TMDB API |
| Movie | Title autocomplete | TMDB API |
| Tweet | Paste URL | Twitter/X oEmbed |
| GIF | Paste URL (Giphy, Tenor, or direct) | Giphy/Tenor oEmbed or direct render |
| Photo | File upload from browser (desktop or mobile) | Supabase Storage |
| Music | Paste Spotify or Apple Music URL | Spotify oEmbed / Apple Music embed |
| Video | Paste YouTube URL | YouTube oEmbed |

---

## Post Actions

Every post supports:
- **Edit** — update caption or type-specific fields
- **Delete** — permanent removal
- **Mark private** — hidden from public feed, still exists in DB. Visible only to the authenticated owner.

---

## Auth

**Magic link via email.** The owner enters their email, Supabase sends a login link, they click it and are authenticated. No password, no OAuth app setup required. Self-hosters only need to configure their Supabase project email settings (or use Supabase's built-in email on the free tier, which has rate limits but is fine for a single-user app).

Supabase RLS enforces:
- Anyone can read non-private posts
- Only the authenticated owner can create, edit, delete, or view private posts

---

## UI & Layout

### Structure
```
┌─────────────────────────────┐
│ Header: name + subtitle     │
├─────────────────────────────┤
│                             │
│  Single content column      │
│  (feed or post detail)      │
│                             │
├─────────────────────────────┤
│ Footer: pagination · year   │
│ name · social links         │
└─────────────────────────────┘
```

No sidebar. Fully responsive — identical layout on desktop and mobile.

### Header
- Site title (owner's name)
- Subtitle (acts as implicit "about" — one line, configured via env var)

### Footer
- Pagination links (previous / next) — always present as baseline
- Year + owner name
- Configurable social links (GitHub, Mastodon, etc. — set via env var or config)

### Top corner toggles
Two small, icon-based toggles in the top corner of the page:
1. **Dark / Light mode** — preference persisted in `localStorage`
2. **Infinite scroll / Pagination** — preference persisted in `localStorage`

When infinite scroll is active, footer pagination links remain present for no-JS and accessibility fallback.

### Aesthetic
Direction C — minimal but media-first. Clean sans-serif, very little UI chrome. Media (photos, GIFs, embeds) gets full column width to breathe. Each post type renders as a card with a subtle, predefined type label (e.g., "Reading", "Watching", "Listening", "Sharing").

### Post type labels
| Type | Label |
|---|---|
| book | Reading |
| tv | Watching |
| movie | Watching |
| tweet | Sharing |
| gif | Sharing |
| photo | Sharing |
| music | Listening |
| video | Watching |

### Admin UI
The admin view is the feed itself — same layout, same column. When authenticated, an "Add" affordance appears (floating button or top-of-feed panel). Posting flow:

1. Tap/click Add
2. Select content type (or paste a URL and let the app detect the type)
3. App fetches metadata (TMDB, Open Library, oEmbed) and shows a preview
4. User adds optional caption, confirms
5. Post appears at the top of the feed

### Permalinks
Every post has a stable URL: `/[username]/[post-id]`

---

## URL Structure

| URL | Description |
|---|---|
| `/` | Redirects to `/[username]` |
| `/[username]` | Public feed |
| `/[username]/[post-id]` | Single post permalink |

---

## Self-Hosting

Target audience: developers comfortable with Vercel and Supabase.

Setup flow:
1. Fork the repo
2. Click "Deploy to Vercel" button in README
3. Create a Supabase project, run the provided SQL migration
4. Set env vars (see `.env.example`): Supabase URL, anon key, service role key, username, site title, subtitle, social links
5. Done — visit `/[username]`

No Docker, no server to manage, no database to maintain beyond the Supabase free tier.

---

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `LATELY_USERNAME` | The username slug (e.g., `tom`) |
| `LATELY_SITE_TITLE` | Display name in header |
| `LATELY_SUBTITLE` | One-line subtitle / implicit about |
| `LATELY_SOCIAL_LINKS` | JSON array of `{ label, url }` pairs |
| `TMDB_API_KEY` | TMDB API key for movie/TV metadata |
| `PUBLIC_BASE_URL` | Full base URL for og: tags and permalinks |

---

## Out of Scope for v1

- Instagram embeds (deferred — requires a reliable mobile sharing workflow first)
- Podcast URLs
- Location check-ins
- Quotes post type
- Multi-user signup flow
- Custom domain management
- Monetization
- Native mobile app
- Amazon cover art / affiliate integration for books (Open Library covers v1)
- Backlog / "want to watch" post states (posts imply current engagement)
