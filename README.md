# Lately

A personal tumblelog. Share what you're reading, watching, listening to, and building — right now.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tommcfarlin/lately)

## What it is

Lately is a single-column, public-but-not-promoted feed for sharing what you're into right now. Books, TV shows, movies, music, videos, tweets, GIFs, and photos — each with an optional caption. No algorithm, no social graph, no performance. Just a page that answers: *what are you into lately?*

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
# Fill in .env.local with your Supabase and TMDB credentials
npm run dev
```

## Tech stack

SvelteKit · TypeScript · Supabase · Vercel · Tailwind CSS

## License

GPL-3.0
