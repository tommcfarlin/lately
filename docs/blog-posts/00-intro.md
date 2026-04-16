# Building Lately: What It Is and Why It Exists

I keep a note on my Mac called something like "Currently." It tracks the books I'm reading, the shows I'm watching, the albums I'm listening to. It's a simple list, purely for me, and I update it maybe once a week. Nobody else sees it.

At some point I started wondering: why not just make that public?

Not in the blog post sense — I don't want to write 800 words about why *Severance* is good. And not in the social media sense — I'm not posting to an algorithm or performing for an audience. Just a clean, quiet page that answers one question: what are you into lately?

That's Lately.

## The Inspiration

Lately is a tumblelog. If you weren't online in 2007, a tumblelog was a lightweight, single-column feed of short posts — links, quotes, photos, music, whatever you were into that week. Tumblr was the big one. There were hundreds of smaller, personal ones, usually hand-rolled with minimal design. They felt personal in a way that blogs didn't, because there was no obligation to have something to say. You could just share a GIF and move on.

That format essentially died when social media consolidated everything. But the impulse didn't. I still want a place to say "I'm reading this" or "listen to this album" without it being a tweet or a Goodreads update or a story that disappears in 24 hours.

Micro.blog scratches a similar itch, and I have real respect for what Manton Reece built there. But I wanted something simpler, more personal, and entirely mine.

## What It Is

Lately is a single-column feed of eight content types:

- **Books** — title, author, cover art
- **TV shows** — with TMDB cover art and metadata
- **Movies** — same
- **Tweets** — embedded via oEmbed
- **GIFs** — from Giphy, Tenor, or a direct URL, with an optional caption
- **Photos** — uploaded directly from my browser (or my phone's browser)
- **Music** — Spotify or Apple Music links, embedded
- **Videos** — YouTube, embedded

Every post can have a caption. Every post has a permalink. The feed is public but not indexed — it's for people I share the link with, not for search engines.

The owner (me, or whoever self-hosts it) sees the same feed, but with an Add button. Paste a URL, the app detects what it is, fetches the metadata, and you confirm. That's the whole posting flow.

## What It's Built With

- **SvelteKit** — for the web app, server-side rendered so link previews work
- **Supabase** — Postgres database, magic link auth, and photo storage
- **Vercel** — free hosting, one-click deploy
- **TMDB** — movie and TV metadata
- **Open Library** — book metadata

No native app. No App Store. Works on desktop and mobile through the browser. Free tier all the way down.

## What This Series Covers

These posts document the build as it happens — decisions made, problems encountered, and what the code actually looks like when it's done. The posts are written after each phase ships, not before.

The phases:

1. **Prerequisites & project setup** — Supabase, TMDB, SvelteKit scaffold, Vercel deploy
2. **The data model & feed** — posts table, RLS, public feed rendering
3. **Post types** — building the eight content types, oEmbed, metadata fetching
4. **The admin UI** — the add flow, auth, editing, privacy toggle
5. **Photos** — file uploads, EXIF stripping, Supabase Storage
6. **Polish** — dark mode, infinite scroll toggle, pagination, permalinks

Each post covers what was built, why it was built that way, and what didn't go as planned.

## What's Next

First up: getting Supabase, TMDB, and the SvelteKit scaffold in place so there's something to actually build on.
