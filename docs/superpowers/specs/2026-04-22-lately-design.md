# Lately v2 — Design Spec

**Date:** 2026-04-22
**Source PRD:** `lately-prd.md` v2.0 (2026-04-22)
**Status:** Approved, ready for implementation planning

This spec consolidates the PRD with the decisions made during the 2026-04-22 brainstorm. Where this document disagrees with the PRD, this document wins. Where it is silent, the PRD stands.

---

## 1. Product Summary

Lately is a self-hosted, single-user tumblelog: a single-column, chronological feed of curated rich-media posts that answers *"what are you into right now?"* One person deploys it, configures it with environment variables, and owns the feed on their own domain.

**Core principles:** owned, fast, intentional, simple to host, beautiful.

**Post types (10):** `music`, `video`, `movie`, `tv`, `book`, `quote`, `photo`, `link`, `podcast`, `social`.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript, SSR |
| Styling | Tailwind CSS |
| DB / Auth / Storage | Supabase (Postgres + RLS, Magic Link auth, Storage) |
| Hosting | Vercel |
| Metadata | TMDB (film/TV), Open Library (books), oEmbed (video/music/social), Open Graph (links, podcasts, fallbacks) |
| Image handling | `sharp` (EXIF strip, resize, re-encode) |
| Dates | `date-fns`, `date-fns-tz` |
| RSS | `rss` lib → `/feed.xml` route |
| Unit testing | Vitest + Testing Library + jsdom |
| E2E testing | Playwright |

Commitlint-formatted commits and labels are required throughout the project.

---

## 3. Privacy Model

**The entire site is public.** There is no feed password, no per-post privacy, no gated permalinks. RSS, permalinks, and the feed index are all unauthenticated-readable.

**Philosophy:** *if you don't want it seen, don't post it.* Curation happens at post-creation time, not via access control.

**Implications:**
- No `PasswordGate.tsx` component.
- No `LATELY_FEED_PASSWORD` env var.
- No password cookie; no password middleware branch.
- `/post/[id]` permalinks are publicly shareable and crawler-readable (`og:` tags render correctly).

---

## 4. Authentication

Magic link via Supabase. Owner identity is determined by **email**, not UUID.

### 4.1 Owner identification

- Env var: `LATELY_OWNER_EMAIL`.
- `isOwner = session?.user?.email === process.env.LATELY_OWNER_EMAIL` (case-insensitive compare).
- This replaces the PRD's `LATELY_USER_ID`. The UUID variant required a two-step bootstrap (deploy → log in → copy UUID back to Vercel); email sidesteps that entirely.

### 4.2 Magic link gate

- `POST /api/auth/magic-link` compares submitted email to `LATELY_OWNER_EMAIL` (case-insensitive).
- Match → send magic link via Supabase, return generic success response.
- No match → return the **same** generic success response, send no email. Prevents the login form from being used as a spam amplifier and does not reveal whether an address is "on file."

### 4.3 Session edge cases

| Scenario | Behavior |
|---|---|
| Valid session, correct owner | Full admin UI (floating `+`, edit/delete controls). |
| Valid session, wrong email | Dedicated `/not-authorized` page. Friendly copy: *"This Lately is for someone else. If you think this is a mistake, check the email you used."* Prominent **Sign out** button. Public feed remains viewable if they sign out. |
| Expired session, owner action attempted | Middleware returns 401 → client redirects to `/login?next={path}`. |
| Expired session, public page | Treated as logged-out; no redirect, no friction. |
| `LATELY_OWNER_EMAIL` unset | Public feed renders normally. `/login` shows setup banner: *"Setup incomplete. Set `LATELY_OWNER_EMAIL` in your environment and redeploy."* No login possible until resolved. |

### 4.4 Future work (flagged, not v1)

- Optional owner-facing log of unauthorized login attempts (email + timestamp). See [docs/future-work.md](../../future-work.md).

---

## 5. Data Model

Unchanged from PRD. Reproduced here for completeness.

### 5.1 `posts` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()`. |
| `user_id` | `uuid` | FK → `auth.users.id`, cascade delete. |
| `type` | `text` | One of the 10 post types. |
| `caption` | `text` | Optional. User-written. |
| `created_at` | `timestamptz` | UTC stored, displayed in owner's timezone. |
| `data` | `jsonb` | Type-specific payload per PRD schemas. |

**Index:** `create index idx_posts_created_at on public.posts (created_at desc);`

### 5.2 RLS policies

- Public `SELECT` (no auth required).
- Authenticated `INSERT` / `UPDATE` / `DELETE` where `auth.uid() = user_id`.

### 5.3 JSONB payloads

Per PRD §Post Types. Ten shapes, one per post type. No changes.

---

## 6. Add / Edit Flow

### 6.1 Add (owner only, via floating `+` button)

1. **URL or search input.** Single field. URL → auto-infer type (skip step 2). Search term → step 2.
2. **Type picker** (conditional). Shown only when type cannot be inferred from URL. Restricted to **Movie, TV, Book** — the three types with supported search APIs. Everything else requires a URL.
3. **Metadata preview.** Server fetches metadata, shows rendered card preview. Special cases: `quote` shows a text-entry form; `photo` shows a file upload input.
4. **Caption** (optional). Single input, skippable.
5. **Post.** `POST /api/posts`. Modal closes. New post appears at the top of the feed without full page reload.

### 6.2 Edit policy

| Post type | Editable fields |
|---|---|
| All types | `caption` |
| `photo` | `caption` + photo file replacement (re-runs full upload pipeline, including EXIF strip) |
| `quote` | All fields (`text`, `attribution`, `source`, `source_url`, `caption`) |
| All other types | `caption` only |

- **URL is never editable.** If the URL was wrong, delete and repost.
- **No metadata refresh.** URL-based posts snapshot at creation. If a YouTube title or TMDB cover changes upstream, Lately does not re-fetch.
- **Delete** is permanent. Confirmation prompt, no soft-delete, no archive.

---

## 7. URL Detection & Normalization

### 7.1 Normalization (runs before detection and before OG scraping)

- Strip common trackers: `utm_*`, `fbclid`, `gclid`, `igshid`, Spotify's `si`, YouTube's `si`.
- Normalize mobile subdomains: `m.youtube.com` → `youtube.com`, etc.
- Trim trailing slashes.
- Preserve query params that carry semantic meaning (e.g., YouTube's `v=` and `t=`).

### 7.2 Type inference table

| Domain / pattern | Inferred type |
|---|---|
| `open.spotify.com/track`, `open.spotify.com/album`, `open.spotify.com/playlist` | `music` |
| `open.spotify.com/show`, `open.spotify.com/episode` | `podcast` |
| `music.apple.com` | `music` |
| `podcasts.apple.com` | `podcast` |
| `youtube.com/watch`, `youtu.be` | `video` |
| `vimeo.com` | `video` |
| `twitter.com`, `x.com` | `social` |
| `instagram.com` | `social` |
| `facebook.com` | `social` |
| `overcast.fm`, `pocketcasts.com`, `podcasts.google.com` | `podcast` |
| `giphy.com`, `tenor.com` | `link` (rendered as GIF via link card) |
| **Everything else** | `link` (OG scrape) |

URLs that match a domain but not a supported sub-path (e.g., `youtube.com/@channel`, `open.spotify.com/artist/...`) fall through to `link`.

### 7.3 Search term flow

- Restricted to Movie, TV, Book.
- Music / video / podcast / social require URL input.
- Flagged for future work: Bandcamp, SoundCloud, TikTok, Threads, Bluesky, Mastodon, LinkedIn, Reddit, Pinterest.

### 7.4 Metadata fetch failures

Fallback with consent. No HTTP codes, no stack traces shown to the user. Error copy is human, specific, blame-free.

**Failure UX:**
- Preview step shows a named, friendly message (examples below).
- Two buttons: **Post as plain link instead** / **Cancel**.
- "Post as link" degrades the post to the `link` type using whatever OG data can be scraped from the original URL.

**Sample copy (spec includes a full copy table in implementation):**
- *"YouTube isn't answering right now. Want to post this as a plain link instead?"*
- *"We couldn't find that movie on TMDB. Double-check the title, or post it as a link."*
- *"Couldn't pull preview info from that page. Post as a link anyway?"*

### 7.5 Testability

**Unit (Vitest):** `normalizeUrl()`, `detectType()`, each metadata fetcher (mocked at HTTP layer) — success, failure, partial-data cases. Table-driven.

**E2E (Playwright):** paste-per-type happy paths, unknown URL → link fallback, unreachable host → consent prompt, search term restricted picker, full happy path per post type end-to-end.

---

## 8. Photo Upload Pipeline

Pipeline for `POST /api/upload`. Runs server-side only.

### 8.1 Constraints

- **One photo per post.** No galleries in v1.
- **Max file size:** 10 MB.
- **Accepted formats:** JPEG, PNG, WebP, HEIC.
- **Uploaded via:** multipart form POST to `/api/upload`. No direct-to-Supabase signed URLs in v1 (keeps EXIF strip atomic — no window where raw EXIF-bearing bytes exist in storage).

### 8.2 Processing steps (in order)

1. **Format validation.** Inspect magic bytes. Reject anything not in the accepted list → friendly message: *"That file type isn't supported. Try JPEG, PNG, WebP, or HEIC."*
2. **Decode with `sharp`.** If decode fails → friendly message: *"Couldn't read that photo. Try re-exporting it and uploading again."*
3. **HEIC → JPEG conversion** (if input was HEIC).
4. **Resize** if long edge > 2400px. Fit within 2400×2400, preserve aspect ratio.
5. **Re-encode.** JPEG quality 85. If source was WebP, re-encode as WebP to preserve transparency.
6. **Orientation.** Apply EXIF orientation so the image is physically upright, then drop the orientation tag.
7. **Metadata strip** — see §8.3 below.
8. **Write** to Supabase Storage at `photos/{user_id}/{uuid}.{ext}`.

### 8.3 Metadata policy

**Strip all of:**
- All GPS tags (`GPSLatitude`, `GPSLongitude`, `GPSAltitude`, `GPSTimeStamp`, etc.)
- All date/time tags (`DateTime`, `DateTimeOriginal`, `DateTimeDigitized`, `OffsetTime*`, `SubSecTime*`)
- Names / owner tags (`Artist`, `Copyright`, `OwnerName`, `CameraOwnerName`, `HostComputer`)
- Free-text tags (`UserComment`, `ImageDescription`)
- Serial / unique IDs (`SerialNumber`, `BodySerialNumber`, `LensSerialNumber`, `UniqueImageID`, `ImageUniqueID`)
- Device / software identifiers (`Make`, `Model`, `LensModel`, `Software`)
- All exposure / capture metadata (`FNumber`, `ISO`, `ExposureTime`, `FocalLength`, etc.)

**Preserve:**
- ICC color profile (otherwise photos look wrong on color-managed displays).
- Pixel dimensions.

**Rationale:** "No PII, really." If displaying exposure data or device model becomes a product decision later, it's added as a deliberate feature.

### 8.4 Failure UX

Format validation failures and strip/encode failures produce **distinct** user-facing messages. Both friendly, both blame-free, no internal error codes.

---

## 9. Feed & Pagination

### 9.1 Home page (`/`)

- SSR, single-column layout, max-width 640px centered.
- **20 posts** rendered server-side, newest first.
- "Load more" button at the bottom when more exist.

### 9.2 Pagination API

- Cursor-based. Sort: `created_at DESC, id DESC` (secondary key for tie-break stability).
- `GET /api/posts?before={iso_timestamp}&limit=20` returns posts with `created_at < before`.
- When response returns fewer than `limit` posts, client hides the "Load more" button.

### 9.3 Empty / end states

- **Empty feed:** *"Nothing here yet."* (Friendly empty state, not a blank column.)
- **End of feed:** "Load more" disappears. No sentinel or infinite-scroll trigger.

### 9.4 New posts

- When the owner creates a new post from the admin modal, the post is prepended to the visible feed client-side without a full page reload.

---

## 10. RSS

- Route: `/feed.xml`. Always public (no gate, since the whole site is public).
- RSS 2.0, newest first.
- Each item: title (derived from type + content), description (caption or metadata summary), link (permalink), `pubDate` (owner's timezone).

---

## 11. UI / Layout

Per PRD §UI & Layout. Highlights:

- **Header:** site title + subtitle (env vars), theme toggle top-right.
- **Footer:** copyright + owner name + social links + RSS link.
- **Post cards:** consistent shape, SVG type icon + label top-left, timestamp top-right, subtle border, rounded corners, no drop shadow.
- **Theme:** light / dark mode, `localStorage`-persisted. One accent color (default `#0070f3`, overridable via env var).
- **Responsive:** single column on all screen sizes. Mobile and desktop receive identical layout.
- **Aesthetic:** Inter or Geist sans-serif. No animations beyond subtle transitions.

---

## 12. Environment Variables

Net changes from PRD: **remove** `LATELY_USER_ID`, `LATELY_FEED_PASSWORD`, and `LATELY_USERNAME`; **add** `LATELY_OWNER_EMAIL`.

Rule of thumb for this self-hosted app: every env var should answer a question only the user can answer themselves. `LATELY_USERNAME` was redundant with `LATELY_SITE_TITLE` (which already carries the owner's display name / branding) and served no route or functional purpose.

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only, never exposed to browser. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as `SUPABASE_URL`, browser-exposed. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same as `SUPABASE_ANON_KEY`, browser-exposed. |
| `TMDB_API_KEY` | Yes | TMDB read access token. |
| `LATELY_OWNER_EMAIL` | Yes | Owner's email. Determines `isOwner`. |
| `LATELY_SITE_TITLE` | Yes | Display name in header. |
| `LATELY_SUBTITLE` | Yes | One-line subtitle. |
| `LATELY_TIMEZONE` | Yes | Owner timezone, e.g. `America/New_York`. |
| `LATELY_SOCIAL_LINKS` | No | JSON array `[{"label","url"}]`. |
| `LATELY_ACCENT_COLOR` | No | Hex, default `#0070f3`. |
| `NEXT_PUBLIC_BASE_URL` | Yes | Full deployment URL. |

---

## 13. Testing Strategy

### 13.1 Local-first acceptance gate

**Every milestone and every shippable feature must be verified end-to-end in the local development environment before being promoted to staging or production.** This is the final acceptance criterion — not "unit tests pass," not "CI green," but the feature actually exercised locally.

Implementation plans must include a "verified locally" checkpoint as the last gate for every milestone. Work is not marked complete until this gate passes.

### 13.2 Unit tests (Vitest)

- Pure functions: `normalizeUrl`, `detectType`, label mappers, date formatters.
- Metadata fetchers: mocked at the HTTP layer, covering success / failure / partial-data / timeout.
- Post DB operations: integration-tested against a local Supabase instance where practical.

### 13.3 E2E tests (Playwright)

- Public feed render (empty + populated).
- Owner login happy path.
- Wrong-email login → `/not-authorized`.
- Each post type: paste → preview → caption → post appears in feed.
- Unknown URL → `link` fallback path.
- Unreachable host → consent-prompt fallback.
- Search term → restricted type picker (Movie / TV / Book only).
- Edit caption on any post type.
- Photo file replacement.
- Quote full-field edit.
- Delete post (with confirmation).
- Pagination: "Load more" fetches next page and hides at end.
- RSS feed renders valid XML.

---

## 14. File Structure

Per PRD §File Structure, with these deltas:

- **Removed:** `components/PasswordGate.tsx` (feed is always public).
- **Added:** `app/not-authorized/page.tsx` (wrong-user screen).
- **Added:** `tests/e2e/` directory for Playwright specs.
- `middleware.ts` only handles auth session reads for owner-only routes — no password branch.

---

## 15. Out of Scope (v1)

Per PRD, unchanged:

- Native iOS / macOS app.
- Sharing to social media.
- Location post type.
- Multi-user signup.
- Per-post privacy toggle.
- Comments or reactions.
- Search or filtering within the feed.
- Custom domain management UI.
- Analytics.

Additionally captured from brainstorm, flagged in [docs/future-work.md](../../future-work.md):

- Scripted Supabase project setup (migrations + storage bucket automation).
- Broader type inference: Bandcamp, SoundCloud, TikTok, Threads, Bluesky, Mastodon, LinkedIn, Reddit, Pinterest.
- Owner-facing log of unauthorized login attempts.
- Env var bootstrapping helper / CLI.

---

## 16. Build Order (high-level, detailed plan to follow)

1. **Phase 0 (done):** Repo reset, Supabase reset.
2. **Phase 1:** Next.js scaffold + commitlint + testing infra (Vitest + Playwright) + Supabase migration + `/not-authorized` shell.
3. **Phase 2:** Auth (magic-link flow, email allowlist, session middleware, `/login`, `/not-authorized`).
4. **Phase 3:** Data layer (types, server queries, RLS verified).
5. **Phase 4:** Feed rendering (public feed, cursor pagination, post-card dispatcher, per-type cards — built incrementally).
6. **Phase 5:** Add flow (URL normalization, type detection, metadata fetchers, preview, caption, post).
7. **Phase 6:** Photo pipeline (upload, EXIF strip, resize, HEIC conversion).
8. **Phase 7:** Edit + delete.
9. **Phase 8:** RSS, permalinks, `og:` tags.
10. **Phase 9:** Polish — theme toggle, empty states, error copy pass, accessibility sweep.

Milestones in GitHub will map to **shippable slices** (outcome-driven, each independently demoable locally), not to phases directly. Detailed plan-to-milestones decomposition happens in the writing-plans step.
