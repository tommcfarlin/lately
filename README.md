# Lately

A self-hosted, single-user tumblelog. One column, chronological, yours.

## Local development

```bash
npm install
npm run dev        # start dev server at http://localhost:3000
npm test           # run unit tests (vitest)
npm run test:e2e   # run e2e tests (playwright)
npm run build      # production build
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only service role key, never exposed to browser |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as `SUPABASE_URL`, browser-exposed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same as `SUPABASE_ANON_KEY`, browser-exposed |
| `TMDB_API_KEY` | Yes | TMDB read access token |
| `LATELY_OWNER_EMAIL` | Yes | Owner email address; determines `isOwner` for admin UI |
| `LATELY_SITE_TITLE` | Yes | Display name shown in the header |
| `LATELY_SUBTITLE` | Yes | One-line subtitle shown next to the site title |
| `LATELY_TIMEZONE` | Yes | Owner timezone, e.g. `America/New_York` |
| `LATELY_SOCIAL_LINKS` | No | Comma-separated `label\|url` pairs, e.g. `GitHub\|https://github.com/you` |
| `LATELY_ACCENT_COLOR` | No | Hex accent color, default `#0070f3` |
| `NEXT_PUBLIC_BASE_URL` | Yes | Full deployment URL, e.g. `https://lately.example.com` |

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tommcfarlin/lately)

Set all required environment variables in your Vercel project settings before deploying.
