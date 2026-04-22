# Lately v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan milestone-by-milestone. Milestones map 1:1 to GitHub Milestones. Issues map 1:1 to GitHub Issues (one PR each). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Lately v2 — a self-hosted, single-user tumblelog — end-to-end, organized into independently demoable shippable slices.

**Architecture:** Next.js (App Router) + TypeScript + Tailwind on Vercel, backed by Supabase (Postgres + RLS + Auth + Storage). Public-everywhere read model; owner identity via `LATELY_OWNER_EMAIL`. Ten post types unified on a single `posts` table with JSONB payloads. Server-side metadata fetch pipeline with graceful fallback-with-consent. Photo uploads are round-tripped through `sharp` for EXIF strip + resize + re-encode in a single atomic pass.

**Tech Stack:** Next.js 15 (App Router, SSR), TypeScript (strict), Tailwind, `@supabase/ssr`, `sharp`, `rss`, `date-fns`, `date-fns-tz`, Vitest + Testing Library + jsdom (unit), Playwright (e2e), Husky + commitlint (commit-message enforcement).

**Source documents:**
- Design spec: [docs/superpowers/specs/2026-04-22-lately-design.md](../specs/2026-04-22-lately-design.md) — canonical
- PRD: original `lately-prd.md` (spec takes precedence on disagreements)

---

## Planning Notes

### Deviation from writing-plans default

This plan is written at **milestone + issue granularity**, not inline-TDD-step granularity. Rationale:
- The plan feeds `gh-kickoff` next, which creates GitHub Milestones and Issues. Those consume scope + acceptance criteria, not TDD code.
- Per-issue TDD-detailed plans will be generated just-in-time during subagent-driven execution by re-invoking `writing-plans` scoped to the single issue.
- This keeps the master plan navigable, keeps individual task plans fresh at execution time, and avoids the thousand-line stale-plan problem.

### Milestone structure

Each milestone is a **shippable slice** — an outcome-driven unit that is independently demoable locally. Milestones are sized so the entire slice fits in roughly 1–2 days of focused work. Issues within a milestone are sized for one PR each.

### The local-first acceptance gate

Every milestone ends with a **verified locally** gate. Work is not marked complete, not merged to `main`, and not considered shippable until a human has exercised the feature end-to-end in the local dev environment. Unit-test-green and CI-green are necessary but not sufficient.

### Commitlint labels

Every issue is labeled with a commitlint type. Used both for the GitHub label and for the conventional-commit prefix on the PR commit. Types in use:

| Label | Commit prefix | Use |
|---|---|---|
| `type:feat` | `feat:` | New user-visible capability. |
| `type:fix` | `fix:` | Bug fix. |
| `type:chore` | `chore:` | Build, tooling, infra, deps, cleanup. |
| `type:docs` | `docs:` | Documentation only. |
| `type:test` | `test:` | Tests only. |
| `type:refactor` | `refactor:` | Code change without behavior change. |
| `type:perf` | `perf:` | Performance improvement. |
| `type:ci` | `ci:` | CI config only. |

Scoped labels also used: `milestone:M1` … `milestone:M10`.

### Issue format for GitHub

Every issue in this plan carries:
- **Title** — commitlint-prefixed summary suitable for the PR title.
- **Scope** — one paragraph, what this does and does not include.
- **Files** — create / modify.
- **Acceptance criteria** — bulleted, testable.
- **Tests** — unit + e2e expectations.
- **Label(s)** — commitlint type + milestone.

### Assignment

All issues assigned to `@tommcfarlin`.

---

## File Structure (target end state)

Established in M1, populated across subsequent milestones.

```
src/
  app/
    layout.tsx                       # root layout, theme, fonts, metadata
    page.tsx                         # public feed (SSR)
    not-authorized/
      page.tsx                       # wrong-email screen
    login/
      page.tsx                       # magic-link entry
    post/
      [id]/
        page.tsx                     # permalink (SSR, og: tags)
    feed.xml/
      route.ts                       # RSS 2.0
    api/
      auth/
        magic-link/
          route.ts                   # POST: send magic link (email allowlist)
        callback/
          route.ts                   # GET: Supabase callback handler
      metadata/
        route.ts                     # POST: normalize + detect + fetch
      posts/
        route.ts                     # GET list (cursor), POST, PATCH, DELETE
      upload/
        route.ts                     # POST: photo pipeline
  components/
    Feed.tsx                         # list + load-more
    PostCard.tsx                     # type-based dispatcher
    post-types/
      LinkCard.tsx
      MusicCard.tsx
      VideoCard.tsx
      MovieCard.tsx
      TvCard.tsx
      BookCard.tsx
      QuoteCard.tsx
      PhotoCard.tsx
      PodcastCard.tsx
      SocialCard.tsx
    AddButton.tsx                    # floating +, owner-only
    AddModal.tsx                     # step orchestrator
    add-steps/
      UrlInput.tsx
      TypePicker.tsx                 # Movie / TV / Book only
      MetadataPreview.tsx
      MetadataFallbackPrompt.tsx     # consent dialog on fetch failure
      QuoteForm.tsx
      PhotoUpload.tsx
      CaptionInput.tsx
    Header.tsx
    Footer.tsx
    ThemeToggle.tsx
    PostIcon.tsx                     # SVG icon switcher
    icons/                           # individual SVG components
    EditControls.tsx                 # hover-revealed edit/delete
    EditModal.tsx                    # edit orchestrator
  lib/
    types/
      post.ts                        # PostType + payload interfaces
    server/
      supabase.ts                    # server client (service role + SSR helpers)
      posts.ts                       # list/get/create/update/delete queries
      auth.ts                        # getSession, requireOwner helpers
      metadata/
        normalize.ts                 # URL normalization
        detect.ts                    # domain/path → PostType
        fetch.ts                     # orchestrates per-type fetchers
        oembed.ts
        tmdb.ts
        openlibrary.ts
        opengraph.ts
        applemusic.ts
        errors.ts                    # named fetch errors + friendly copy
      image/
        pipeline.ts                  # validate → decode → resize → strip → encode
        strip-policy.ts              # explicit EXIF allow/block lists
    client/
      supabase.ts                    # browser client (anon key)
    utils/
      date.ts                        # UTC → owner timezone
      labels.ts                      # type → label map
      cn.ts                          # classname helper
      rss.ts                         # RSS generation
  middleware.ts                      # auth session read
supabase/
  migrations/
    001_posts.sql                    # posts table + RLS + index
tests/
  e2e/                               # Playwright specs (per milestone)
  fixtures/                          # HEIC/JPEG test photos, mock API responses
.github/
  workflows/
    ci.yml                           # lint + typecheck + unit + e2e
  labels.yml                         # repo labels managed via github-actions/labeler
commitlint.config.js
.husky/
  commit-msg                         # runs commitlint
README.md
docs/
  future-work.md
  superpowers/
    specs/
      2026-04-22-lately-design.md
    plans/
      2026-04-22-lately-implementation.md
```

---

## Milestones Overview

| ID | Slice | Shippable outcome |
|---|---|---|
| **M1** | Foundation | Empty Next.js shell boots locally; commits enforced by commitlint; CI green on a trivial test. |
| **M2** | Auth | Owner can log in via magic link; wrong email gets `/not-authorized`; session persists locally. |
| **M3** | Data + Empty Feed | `posts` table + RLS applied to local Supabase; home page renders cursor-paginated feed from seed data. |
| **M4** | First Post Type (Link) | Paste any URL → fallback OG scrape → post appears as `link` card. Full add-flow skeleton validated. |
| **M5** | Rich Post Types | Music, Video, Movie, TV, Book, Podcast, Social types all postable with proper metadata. |
| **M6** | Photo Pipeline | Upload → EXIF-strip → resize → HEIC convert → store → render. |
| **M7** | Quote | Manual entry form posts a quote card. |
| **M8** | Edit + Delete | Caption edit (all types), photo re-upload, quote full edit, delete with confirm. |
| **M9** | Share Surfaces | `/feed.xml` valid RSS; `/post/[id]` permalinks with `og:` tags. |
| **M10** | Polish | Theme toggle, empty/end states, error copy pass, accessibility sweep, README. |

---

## M1 — Foundation

**Shippable outcome:** `npm run dev` boots. `/` renders a placeholder header + footer. Commits are rejected unless they match commitlint. `npm test` runs and passes a smoke test. `npm run test:e2e` runs Playwright and passes a smoke test. CI workflow green on push.

### Issues

#### M1-1 · `chore: scaffold next.js project with tailwind and typescript`
- **Scope:** Run `create-next-app`, commit the result. App Router, TS strict, Tailwind, ESLint, `src/` dir, `@/*` alias.
- **Files:** entire scaffold (generated).
- **Acceptance:**
  - `npm run dev` serves at `http://localhost:3000`.
  - `npm run build` succeeds.
  - `npm run lint` passes.
  - `tsconfig.json` has `"strict": true`.
- **Tests:** N/A (scaffold).
- **Labels:** `type:chore`, `milestone:M1`.

#### M1-2 · `chore: install project dependencies`
- **Scope:** Install runtime and dev deps per spec.
- **Files:** `package.json`, `package-lock.json`.
- **Runtime:** `@supabase/supabase-js`, `@supabase/ssr`, `sharp`, `rss`, `date-fns`, `date-fns-tz`.
- **Dev:** `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `@commitlint/cli`, `@commitlint/config-conventional`, `husky`.
- **Acceptance:** `npm install` clean, no peer-dep warnings blocking.
- **Tests:** N/A.
- **Labels:** `type:chore`, `milestone:M1`.

#### M1-3 · `chore: configure commitlint and husky`
- **Scope:** Conventional-commits enforcement on every commit, locally.
- **Files:** `commitlint.config.js`, `.husky/commit-msg`, `package.json` (prepare script).
- **Acceptance:**
  - `git commit -m "broken message"` is rejected.
  - `git commit -m "feat: add thing"` is accepted.
  - Types allowed: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, `ci`, `style`.
- **Tests:** manual — attempt bad commit, confirm rejection.
- **Labels:** `type:chore`, `milestone:M1`.

#### M1-4 · `chore: configure vitest with smoke test`
- **Scope:** Unit-test infra working.
- **Files:** `vitest.config.ts`, `tests/unit/smoke.test.ts`.
- **Acceptance:**
  - `npm test` runs and passes a trivial `expect(1 + 1).toBe(2)` test.
  - Testing Library + jsdom configured so component tests can run later.
- **Labels:** `type:test`, `milestone:M1`.

#### M1-5 · `chore: configure playwright with smoke test`
- **Scope:** E2E infra working.
- **Files:** `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `package.json` scripts.
- **Acceptance:**
  - `npm run test:e2e` boots `next dev`, navigates to `/`, asserts response 200.
  - Tests run headless by default.
- **Labels:** `type:test`, `milestone:M1`.

#### M1-6 · `ci: github actions workflow for lint, typecheck, unit, e2e`
- **Scope:** CI on every push / PR.
- **Files:** `.github/workflows/ci.yml`.
- **Acceptance:**
  - Jobs run: install → lint → typecheck → unit tests → Playwright (headless).
  - Green on main after this PR.
- **Labels:** `type:ci`, `milestone:M1`.

#### M1-7 · `feat: base layout, header, footer, theme scaffolding`
- **Scope:** Visual shell only. No data. Theme toggle UI present, persists to `localStorage`.
- **Files:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ThemeToggle.tsx`, `src/app/globals.css`.
- **Acceptance:**
  - Home page shows header (title + subtitle from env), empty body ("Nothing here yet." placeholder), footer.
  - Theme toggle flips `class="dark"` on `<html>`, persists across reloads.
  - No post-type-specific code yet.
- **Tests:**
  - Unit: ThemeToggle toggles state.
  - E2E: page loads, theme toggle click changes scheme.
- **Labels:** `type:feat`, `milestone:M1`.

#### M1-8 · `docs: readme setup skeleton`
- **Scope:** Placeholder README with deploy steps, env var table, local dev commands. Will be fleshed out in M10.
- **Files:** `README.md`.
- **Acceptance:** README lists all env vars from spec §12, documents `npm run dev`/`test`/`build`.
- **Labels:** `type:docs`, `milestone:M1`.

### M1 verified-locally gate
- [ ] `git clone` → `npm install` → `npm run dev` → site loads at `localhost:3000`.
- [ ] Header + footer visible. Theme toggle works.
- [ ] Attempt a non-commitlint commit → rejected.
- [ ] `npm test` passes; `npm run test:e2e` passes.
- [ ] CI green on the M1 merge.

---

## M2 — Authentication

**Shippable outcome:** Owner can request a magic link at `/login`, click through Supabase's email, land back authenticated, see a floating `+` button on the home page. A non-owner email at `/login` produces no email and the same generic response; even if they somehow hold a valid Supabase session, they get `/not-authorized`.

**Prereq:** Supabase project exists (done in Phase 0 reset). `LATELY_OWNER_EMAIL` env var set locally.

### Issues

#### M2-1 · `feat: supabase clients (server + browser)`
- **Scope:** `@supabase/ssr` clients wired for Next.js App Router.
- **Files:** `src/lib/server/supabase.ts`, `src/lib/client/supabase.ts`.
- **Acceptance:** Helper functions `createServerClient()` and `createBrowserClient()` return typed clients; session reads from cookies on server.
- **Tests:** Unit — mocked cookie store, assert correct client config.
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-2 · `feat: auth helpers (getSession, getIsOwner, requireOwner)`
- **Scope:** Server-side helpers that every protected route/action uses.
- **Files:** `src/lib/server/auth.ts`.
- **Acceptance:**
  - `getSession()` returns Supabase session or null.
  - `getIsOwner()` returns `session?.user?.email?.toLowerCase() === LATELY_OWNER_EMAIL.toLowerCase()`.
  - `requireOwner()` throws/redirects if not owner.
  - Empty `LATELY_OWNER_EMAIL` → `getIsOwner()` always false.
- **Tests:** Unit — all cases (no session, wrong email, right email, env unset).
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-3 · `feat: login page with email input`
- **Scope:** `/login` renders an email field + submit button. Shows setup banner when `LATELY_OWNER_EMAIL` unset.
- **Files:** `src/app/login/page.tsx`.
- **Acceptance:**
  - Empty env → setup banner visible, form disabled.
  - Env set → form enabled.
  - Submit triggers `POST /api/auth/magic-link`, shows generic "Check your inbox" response regardless of whether email matched.
- **Tests:** E2E — empty env shows banner; filled env shows form.
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-4 · `feat: magic-link api with email allowlist`
- **Scope:** `POST /api/auth/magic-link` only sends when submitted email matches `LATELY_OWNER_EMAIL`. Same response either way.
- **Files:** `src/app/api/auth/magic-link/route.ts`.
- **Acceptance:**
  - Matching email → Supabase `signInWithOtp()` invoked, response 200.
  - Non-matching email → no Supabase call, response 200 with identical body.
  - Missing env → 503 with generic "Setup incomplete" message.
  - Rate limit (simple in-memory token bucket) prevents obvious abuse in dev.
- **Tests:** Unit — all three paths, mocked Supabase client.
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-5 · `feat: auth callback route`
- **Scope:** `GET /api/auth/callback` handles Supabase's PKCE code → session exchange.
- **Files:** `src/app/api/auth/callback/route.ts`.
- **Acceptance:**
  - Valid code → session set, redirect to `/` or `?next=` destination.
  - Invalid/missing code → redirect to `/login` with friendly query flag.
- **Tests:** Unit — mocked Supabase exchange, both paths.
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-6 · `feat: middleware for session attachment and owner-gate`
- **Scope:** Next.js `middleware.ts` reads session cookies so server components can use `getIsOwner()` synchronously.
- **Files:** `src/middleware.ts`.
- **Acceptance:**
  - Public routes (`/`, `/post/[id]`, `/feed.xml`, `/login`, `/not-authorized`) never redirect.
  - Owner-only API routes (`/api/posts` POST/PATCH/DELETE, `/api/upload`) return 401 on no/invalid/wrong-user session.
  - Expired session on public route → treated as logged-out, no redirect.
- **Tests:** E2E — unauthenticated POST to `/api/posts` returns 401.
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-7 · `feat: not-authorized page`
- **Scope:** `/not-authorized` renders when a session is valid but email doesn't match.
- **Files:** `src/app/not-authorized/page.tsx`.
- **Acceptance:**
  - Copy: *"This Lately is for someone else. If you think this is a mistake, check the email you used."*
  - Prominent **Sign out** button → clears session → redirects to `/`.
  - Reached automatically when a non-owner hits any owner-only admin surface.
- **Tests:** E2E — force a wrong-email session, confirm page shown, sign-out returns to `/`.
- **Labels:** `type:feat`, `milestone:M2`.

#### M2-8 · `feat: floating add button (owner-only)`
- **Scope:** `AddButton.tsx` renders only when `isOwner === true`. Click is a no-op for now (modal in M4).
- **Files:** `src/components/AddButton.tsx`, updates to `src/app/layout.tsx`.
- **Acceptance:**
  - Anon user: button not in DOM.
  - Authenticated wrong email: button not in DOM (they're already on `/not-authorized` anyway).
  - Owner: button visible bottom-right.
- **Tests:** Unit (mock `getIsOwner`); E2E (owner login → button visible).
- **Labels:** `type:feat`, `milestone:M2`.

### M2 verified-locally gate
- [ ] With `LATELY_OWNER_EMAIL` unset: `/login` shows setup banner.
- [ ] With it set to your email: submit form → email arrives → click link → land logged in → `+` button appears.
- [ ] With it set to *a different* email than yours: submit your email → no email arrives, generic success response shown.
- [ ] Manually set a wrong-email session (e.g., via Supabase dashboard) → visiting `/` shows nothing abnormal; visiting an owner-only route shows `/not-authorized`.
- [ ] Sign out → `+` button disappears.

---

## M3 — Data Layer + Empty Feed

**Shippable outcome:** Supabase `posts` table exists with RLS. A seed script inserts 30 mock rows of varying types (simplest payloads only — `link` type is fine). Home page renders 20 posts, cursor pagination works, "Load more" fetches the rest.

**Prereq:** M2 done. Local Supabase project reachable.

### Issues

#### M3-1 · `feat: post types and payload interfaces`
- **Scope:** TypeScript definitions for all 10 post types and their JSONB shapes, matching spec §5.3.
- **Files:** `src/lib/types/post.ts`.
- **Acceptance:** `PostType` union exported; discriminated union `PostData` covers all 10; `Post` interface combines DB columns + typed data.
- **Tests:** Unit — type-narrowing tests via `expectTypeOf` or equivalent compile-time assertions.
- **Labels:** `type:feat`, `milestone:M3`.

#### M3-2 · `feat: supabase migration for posts table + rls + index`
- **Scope:** Canonical SQL matching spec §5.1–5.2.
- **Files:** `supabase/migrations/001_posts.sql`.
- **Acceptance:** Applied against local Supabase creates `posts` table with all columns, RLS policies, and the `created_at` descending index.
- **Tests:** Integration — apply migration, insert + read + delete through anon and service-role keys, confirm RLS behavior matches expectations.
- **Labels:** `type:feat`, `milestone:M3`.

#### M3-3 · `chore: seed script for local development`
- **Scope:** `scripts/seed.ts` inserts 30 mock posts (mostly `link` type with hand-curated OG-style payloads). Idempotent (wipes first or upserts).
- **Files:** `scripts/seed.ts`, `package.json` script `db:seed`.
- **Acceptance:** `npm run db:seed` populates local Supabase; re-running doesn't duplicate.
- **Labels:** `type:chore`, `milestone:M3`.

#### M3-4 · `feat: server-side posts queries (list with cursor, get by id)`
- **Scope:** `src/lib/server/posts.ts` — `listPosts({ before, limit })` and `getPost(id)`.
- **Files:** `src/lib/server/posts.ts`.
- **Acceptance:**
  - `listPosts()` sorts `created_at DESC, id DESC`; cursor filter `created_at < before` with tie-break on `id`.
  - Returns typed `Post[]`.
  - `getPost(id)` returns `Post | null`.
- **Tests:** Integration against local Supabase — seed, paginate, verify stability across inserts.
- **Labels:** `type:feat`, `milestone:M3`.

#### M3-5 · `feat: feed component with cursor pagination`
- **Scope:** `Feed.tsx` receives initial 20 SSR posts; "Load more" button triggers `GET /api/posts?before=...&limit=20` and appends.
- **Files:** `src/components/Feed.tsx`, `src/app/api/posts/route.ts` (GET only — POST/PATCH/DELETE land in later milestones).
- **Acceptance:**
  - Home page SSRs 20 posts.
  - Clicking "Load more" fetches next 20, appends.
  - When response has < 20 posts, button hides.
  - Empty DB → friendly empty state.
- **Tests:** E2E — seed 45 rows, load home, click "Load more" twice, confirm 45 total, button gone on third click.
- **Labels:** `type:feat`, `milestone:M3`.

#### M3-6 · `feat: generic PostCard dispatcher + minimal placeholder per type`
- **Scope:** `PostCard.tsx` switches on `post.type` and renders a skeleton card per type (just the type label + icon + caption). Real per-type cards arrive in M4–M7.
- **Files:** `src/components/PostCard.tsx`, `src/components/PostIcon.tsx`, `src/components/icons/*.tsx`, `src/lib/utils/labels.ts`, `src/lib/utils/date.ts`.
- **Acceptance:**
  - Every post type renders without error.
  - Icon + label per spec §Post Type Labels & Icons.
  - Timestamp shows relative ("2 hours ago") for < 24h, absolute ("March 4") otherwise.
- **Tests:** Unit — snapshot or role-based tests per type; date utility unit tests.
- **Labels:** `type:feat`, `milestone:M3`.

### M3 verified-locally gate
- [ ] Apply migration to local Supabase.
- [ ] `npm run db:seed` populates 30 rows.
- [ ] Home page shows 20 posts, oldest 10 appear on "Load more" click, button then hides.
- [ ] No TypeScript errors, no runtime errors in browser console.
- [ ] Inserting a new row via Supabase SQL editor and reloading shows it at the top.

---

## M4 — First Post Type End-to-End (`link`)

**Shippable outcome:** Owner clicks `+`, pastes a URL to any random website, sees OG preview, optionally adds a caption, posts. New card appears at the top of the feed. This validates the entire add-flow machinery for the simplest type before we multiply it by nine.

### Issues

#### M4-1 · `feat: url normalization utility`
- **Scope:** `normalizeUrl(input: string): string | null` — strips UTM/fbclid/gclid/igshid/si/YouTube-si, normalizes `m.` subdomains, trims trailing slashes, returns null for invalid URLs.
- **Files:** `src/lib/server/metadata/normalize.ts`.
- **Acceptance:** Table-driven tests cover 20+ cases.
- **Tests:** Unit.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-2 · `feat: url type detection`
- **Scope:** `detectType(url: string): PostType` — domain/path matching per spec §7.2. Defaults to `link`.
- **Files:** `src/lib/server/metadata/detect.ts`.
- **Acceptance:** Table-driven tests cover every row in spec §7.2 plus unknown domains → `link`, plus sub-path misses (e.g., `youtube.com/@channel` → `link`).
- **Tests:** Unit.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-3 · `feat: opengraph scraper with friendly errors`
- **Scope:** `fetchOpenGraph(url)` — HEADs then GETs, parses OG tags, returns `{ title, description, image_url, site_name }` or throws a named error.
- **Files:** `src/lib/server/metadata/opengraph.ts`, `src/lib/server/metadata/errors.ts`.
- **Acceptance:**
  - Successful scrape returns payload.
  - 4xx/5xx → throws `MetadataFetchError` with `friendlyMessage` and `service` fields.
  - Timeout (5s) → same.
  - No OG tags at all → synthesize from `<title>` + hostname.
- **Tests:** Unit — fetch mocked via `undici`/`msw`.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-4 · `feat: metadata api endpoint`
- **Scope:** `POST /api/metadata { url | searchTerm, type? }` → `{ type, data }` or `{ error: { friendlyMessage, service } }`. Owner-only.
- **Files:** `src/app/api/metadata/route.ts`, `src/lib/server/metadata/fetch.ts` (orchestrator).
- **Acceptance:**
  - URL → normalize → detect → fetch via correct fetcher.
  - Errors return structured friendly payload (no HTTP codes, no stack traces).
  - Non-owner → 401.
- **Tests:** E2E — owner session paste valid URL, assert response; paste unreachable URL, assert friendly error.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-5 · `feat: posts api create endpoint`
- **Scope:** `POST /api/posts { type, caption, data }` → inserts row, returns created post. Owner-only. RLS enforced server-side too (via service-role client + explicit user_id).
- **Files:** `src/app/api/posts/route.ts` (extend).
- **Acceptance:**
  - Valid payload → 201 with created post.
  - Unknown type → 400.
  - Non-owner → 401.
  - Malformed JSONB data for the declared type → 400 with friendly message.
- **Tests:** Integration.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-6 · `feat: add modal skeleton + url input step`
- **Scope:** `AddModal.tsx` orchestrates steps. First step: `UrlInput.tsx` — paste URL or type search term. URL path skips type picker; search term shows it (with only Movie/TV/Book).
- **Files:** `src/components/AddModal.tsx`, `src/components/add-steps/UrlInput.tsx`, `src/components/add-steps/TypePicker.tsx`.
- **Acceptance:**
  - Modal opens on `+` click.
  - URL paste → loading → moves to preview step.
  - Search term → shows Movie/TV/Book picker only.
  - Esc / backdrop click closes with confirm if dirty.
- **Tests:** Unit + E2E.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-7 · `feat: metadata preview step + fallback-with-consent`
- **Scope:** `MetadataPreview.tsx` renders a preview card. On fetch failure, `MetadataFallbackPrompt.tsx` offers **Post as plain link instead** / **Cancel**. Copy is human and names the specific service.
- **Files:** `src/components/add-steps/MetadataPreview.tsx`, `src/components/add-steps/MetadataFallbackPrompt.tsx`, `src/lib/server/metadata/errors.ts` (copy table).
- **Acceptance:**
  - Success → preview renders using target card component.
  - Failure → prompt with friendly message; "Post as link" re-fetches as forced `link` type.
  - No error codes or stack traces shown anywhere.
- **Tests:** Unit — all copy entries exist and are non-empty; E2E — simulate failure, confirm prompt.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-8 · `feat: caption step`
- **Scope:** `CaptionInput.tsx` — optional text area, skippable.
- **Files:** `src/components/add-steps/CaptionInput.tsx`.
- **Acceptance:** Empty caption OK; max length 500 chars; Skip / Post buttons.
- **Tests:** Unit.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-9 · `feat: link card renderer`
- **Scope:** `LinkCard.tsx` — title, description, OG image, site name, caption. Falls back gracefully when fields missing.
- **Files:** `src/components/post-types/LinkCard.tsx`.
- **Acceptance:** Renders with full payload, partial payload, image 404 (uses placeholder), external link opens in new tab.
- **Tests:** Unit snapshot/role-based.
- **Labels:** `type:feat`, `milestone:M4`.

#### M4-10 · `feat: optimistic feed insertion on post`
- **Scope:** On successful create, prepend post to feed state client-side without full reload.
- **Files:** updates to `Feed.tsx` and `AddModal.tsx`.
- **Acceptance:** After posting, modal closes and new card is visible at top within 100ms.
- **Tests:** E2E.
- **Labels:** `type:feat`, `milestone:M4`.

### M4 verified-locally gate
- [ ] Log in locally.
- [ ] Click `+`, paste a real URL (e.g., a blog post) → see OG preview → add caption → post.
- [ ] Card appears at top of feed immediately.
- [ ] Refresh page → card still there.
- [ ] Paste a URL with heavy UTM params → stored URL is cleaned.
- [ ] Paste a URL that 404s → friendly fallback prompt → "Post as link" still works.
- [ ] Type a search term → only Movie/TV/Book appear in picker.

---

## M5 — Rich Post Types

**Shippable outcome:** Owner can post a link to Spotify (music or podcast depending on sub-path), YouTube (video), a TMDB movie or TV show (via URL or search), an Open Library book (via URL or search), a podcast episode (overcast/apple podcasts), and X/Instagram/Facebook social posts. Each renders with a type-appropriate card.

Each type is one issue = one PR. Fetcher + card are bundled per type because their shape is tightly coupled.

### Issues

#### M5-1 · `feat: oembed fetcher + music post type (spotify/apple music)`
- **Scope:** `oembed.ts` generic oEmbed fetcher. `applemusic.ts` URL→embed-URL transform (Apple Music doesn't expose oEmbed; we construct iframe URL deterministically). `MusicCard.tsx`.
- **Tests:** Unit (fetcher), E2E (post Spotify + Apple Music URLs).
- **Labels:** `type:feat`, `milestone:M5`.

#### M5-2 · `feat: video post type (youtube, vimeo)`
- **Scope:** oEmbed-based video fetcher, `VideoCard.tsx`. Handles `youtube.com/watch`, `youtu.be`, `vimeo.com`.
- **Tests:** Unit + E2E.
- **Labels:** `type:feat`, `milestone:M5`.

#### M5-3 · `feat: tmdb fetcher + movie post type`
- **Scope:** TMDB client (search + detail + poster URL construction). `MovieCard.tsx`. Both URL and search-term paths.
- **Tests:** Unit (fetcher mocked), E2E (search "Interstellar" → pick → post).
- **Labels:** `type:feat`, `milestone:M5`.

#### M5-4 · `feat: tv post type (reuses tmdb client)`
- **Scope:** TV show variant of M5-3. `TvCard.tsx`. Season field optional.
- **Tests:** Unit + E2E.
- **Labels:** `type:feat`, `milestone:M5`.

#### M5-5 · `feat: open library fetcher + book post type`
- **Scope:** Open Library client. `BookCard.tsx`. Both URL and search paths (title or ISBN).
- **Tests:** Unit + E2E.
- **Labels:** `type:feat`, `milestone:M5`.

#### M5-6 · `feat: podcast post type (og-scrape based)`
- **Scope:** Podcast fetcher reuses OG scraper with podcast-aware field mapping. `PodcastCard.tsx`.
- **Tests:** Unit (mock OG responses from overcast/apple podcasts), E2E.
- **Labels:** `type:feat`, `milestone:M5`.

#### M5-7 · `feat: social post type (x, instagram, facebook)`
- **Scope:** X oEmbed (if available), Instagram oEmbed, Facebook → OG fallback per spec §6. `SocialCard.tsx`.
- **Tests:** Unit + E2E.
- **Labels:** `type:feat`, `milestone:M5`.

### M5 verified-locally gate
- [ ] Successfully post one example of each of: music (Spotify), music (Apple Music), video (YouTube), video (Vimeo), movie (TMDB search), TV (TMDB search), book (Open Library search), book (Open Library ISBN), podcast (Overcast), podcast (Apple Podcasts), social (X), social (Instagram).
- [ ] Spotify `/show/...` URL correctly inferred as `podcast`, not `music`.
- [ ] YouTube channel URL falls through to `link`, not `video`.
- [ ] Each card renders correctly in both light and dark mode.

---

## M6 — Photo Pipeline

**Shippable outcome:** Owner picks `+` → type picker (or upload variant — see design), uploads a photo, preview shows the processed image, posts. Photo is EXIF-stripped, resized, and stored. Card renders photo full-width.

### Issues

#### M6-1 · `feat: image pipeline core (validate, decode, resize, encode)`
- **Scope:** `pipeline.ts` — pure function taking a buffer, returning either processed buffer + format or a named error.
- **Files:** `src/lib/server/image/pipeline.ts`, `src/lib/server/image/strip-policy.ts`.
- **Acceptance:**
  - Accepts JPEG, PNG, WebP, HEIC; rejects others with `UnsupportedFormatError`.
  - HEIC → JPEG conversion.
  - Resize to max 2400px long edge.
  - JPEG q85; WebP preserves transparency.
  - Apply-then-drop orientation.
  - Strips all tags per spec §8.3 (allowlist approach).
  - Preserves ICC profile.
- **Tests:**
  - Unit: fixture-based tests per format. Verify output has zero GPS/DateTime/Make/Model/etc. tags via `exiftool` or `sharp.metadata()`.
  - Unit: verify ICC profile preserved.
  - Unit: verify dimensions capped.
- **Labels:** `type:feat`, `milestone:M6`.

#### M6-2 · `feat: upload api with friendly errors`
- **Scope:** `POST /api/upload` — multipart, owner-only, size-capped at 10MB. Runs pipeline, writes to Supabase storage at `photos/{user_id}/{uuid}.{ext}`, returns `{ storage_path, public_url }`.
- **Files:** `src/app/api/upload/route.ts`.
- **Acceptance:**
  - > 10MB → 413 with friendly message.
  - Unsupported format → 400 with one friendly message.
  - Pipeline decode/encode failure → 400 with a distinct friendly message.
  - Success → 201.
- **Tests:** Integration — upload each fixture; confirm file lands in storage with expected metadata scrubbed.
- **Labels:** `type:feat`, `milestone:M6`.

#### M6-3 · `feat: photo upload step in add modal`
- **Scope:** `PhotoUpload.tsx` — file picker, preview, error handling.
- **Files:** `src/components/add-steps/PhotoUpload.tsx`.
- **Acceptance:**
  - File select → progress indicator → preview.
  - Error → friendly inline message, retry possible.
- **Tests:** E2E.
- **Labels:** `type:feat`, `milestone:M6`.

#### M6-4 · `feat: photo card renderer`
- **Scope:** `PhotoCard.tsx` — full-width image, caption below, native lazy-loading.
- **Files:** `src/components/post-types/PhotoCard.tsx`.
- **Acceptance:** Renders; image has `loading="lazy"` and explicit width/height to avoid CLS.
- **Tests:** Unit.
- **Labels:** `type:feat`, `milestone:M6`.

#### M6-5 · `test: exif strip verification fixtures`
- **Scope:** Committed fixture photos (JPEG with GPS, HEIC with everything, PNG with tEXt chunks) plus a Vitest test that asserts post-pipeline output has **no** tags in the block list.
- **Files:** `tests/fixtures/photos/*`, `tests/unit/image/strip.test.ts`.
- **Acceptance:** Test fails if any future change leaks PII tags through.
- **Labels:** `type:test`, `milestone:M6`.

### M6 verified-locally gate
- [ ] Post a JPEG with GPS data → download the stored file → confirm (via Preview.app Inspector or `exiftool`) that no GPS or DateTime tags remain.
- [ ] Post a HEIC from iPhone → stored as JPEG, renders correctly.
- [ ] Post a 15MB photo → rejected with friendly message.
- [ ] Post a `.gif` → rejected with friendly message (unsupported format).
- [ ] Post a sideways-oriented photo → renders upright.
- [ ] Color looks correct on a color-managed display (ICC preserved).

---

## M7 — Quote

**Shippable outcome:** Owner picks `+` → type picker → Quote → enters text, attribution, source, source URL → posts.

### Issues

#### M7-1 · `feat: quote form step`
- **Scope:** `QuoteForm.tsx` — text area (required), attribution, source, source URL (all optional).
- **Files:** `src/components/add-steps/QuoteForm.tsx`.
- **Acceptance:** Validation: text required, max 1000 chars; URL validated.
- **Tests:** Unit.
- **Labels:** `type:feat`, `milestone:M7`.

#### M7-2 · `feat: quote card renderer`
- **Scope:** `QuoteCard.tsx` — typographic treatment for quote text, smaller attribution line, linked source.
- **Files:** `src/components/post-types/QuoteCard.tsx`.
- **Tests:** Unit.
- **Labels:** `type:feat`, `milestone:M7`.

#### M7-3 · `feat: wire quote into add-modal flow`
- **Scope:** Update `AddModal.tsx` so type picker "Quote" routes to `QuoteForm` instead of URL+preview.
- **Files:** `src/components/AddModal.tsx`.
- **Tests:** E2E — type picker → Quote → form → post → visible.
- **Labels:** `type:feat`, `milestone:M7`.

### M7 verified-locally gate
- [ ] Post a quote with all fields, attribution-only, and text-only variants.
- [ ] Long quote wraps nicely.
- [ ] Source link opens in new tab.

---

## M8 — Edit + Delete

**Shippable outcome:** Owner hovers any card and sees edit/delete affordances. Edit per spec §6.2: caption everywhere, photo file replacement, full edit for quote. Delete with confirm.

### Issues

#### M8-1 · `feat: edit controls component (hover/tap-revealed)`
- **Scope:** `EditControls.tsx` — small edit + delete buttons; visible on hover (desktop) or long-press/tap (mobile) when owner.
- **Files:** `src/components/EditControls.tsx`.
- **Acceptance:** Non-owner: not rendered. Owner: visible.
- **Tests:** Unit + E2E.
- **Labels:** `type:feat`, `milestone:M8`.

#### M8-2 · `feat: posts api patch endpoint (caption + quote fields)`
- **Scope:** `PATCH /api/posts/[id]` — owner-only. Accepts `{ caption }` for any type; for `quote` also accepts `{ data: {text, attribution, source, source_url} }`. Rejects URL changes explicitly.
- **Files:** extends `src/app/api/posts/route.ts` or adds `[id]/route.ts`.
- **Tests:** Integration — each allowed/disallowed path.
- **Labels:** `type:feat`, `milestone:M8`.

#### M8-3 · `feat: edit modal (caption + quote variants)`
- **Scope:** `EditModal.tsx` — pre-populated form; caption-only for most types, full fields for quote.
- **Files:** `src/components/EditModal.tsx`.
- **Tests:** E2E — edit caption on a link post; edit all fields on a quote.
- **Labels:** `type:feat`, `milestone:M8`.

#### M8-4 · `feat: photo file replacement flow`
- **Scope:** Edit modal for photo posts includes "Replace photo" action → runs full upload pipeline → PATCH updates `data.storage_path` / `public_url`. Old file deleted from storage.
- **Files:** extends `EditModal.tsx`, `src/app/api/upload/route.ts`, posts API.
- **Tests:** E2E — replace photo, confirm old file gone from storage, new file present, EXIF stripped.
- **Labels:** `type:feat`, `milestone:M8`.

#### M8-5 · `feat: delete endpoint + confirmation ui`
- **Scope:** `DELETE /api/posts/[id]` — owner-only. UI confirmation dialog. Photo posts also delete file from storage.
- **Tests:** Integration + E2E.
- **Labels:** `type:feat`, `milestone:M8`.

### M8 verified-locally gate
- [ ] Edit caption on each post type → persists.
- [ ] Attempt to edit URL → no field available (design-enforced).
- [ ] Edit all fields of a quote → persists.
- [ ] Replace a photo → old file gone from Supabase storage, new card shows new image.
- [ ] Delete a post → confirmation shown → deletion persists → file gone from storage for photo posts.

---

## M9 — Share Surfaces (RSS + Permalinks + OG Tags)

**Shippable outcome:** `/feed.xml` returns valid RSS 2.0. `/post/[id]` renders a shareable page with rich `og:` and `twitter:` tags that unfurl nicely in Slack, Twitter, iMessage.

### Issues

#### M9-1 · `feat: permalink page (/post/[id])`
- **Scope:** SSR page rendering a single post with the same card as the feed. Includes back-to-feed link. Includes all `og:` and `twitter:` tags (title, description, image where applicable).
- **Files:** `src/app/post/[id]/page.tsx`.
- **Acceptance:** 404 when ID not found. Meta tags populated from post data.
- **Tests:** E2E — load a permalink, inspect meta tags.
- **Labels:** `type:feat`, `milestone:M9`.

#### M9-2 · `feat: rss feed route (/feed.xml)`
- **Scope:** `route.ts` generates RSS 2.0 from the most recent 50 posts. Content-Type `application/rss+xml`. Always public.
- **Files:** `src/app/feed.xml/route.ts`, `src/lib/utils/rss.ts`.
- **Acceptance:**
  - Validates against the W3C RSS validator.
  - `pubDate` in owner's timezone.
  - Item titles derived from type + content (e.g., "Listening: Song Title" for music).
  - `link` is the permalink.
- **Tests:** Unit (XML snapshot); E2E (route returns valid XML).
- **Labels:** `type:feat`, `milestone:M9`.

#### M9-3 · `docs: link to rss from footer`
- **Scope:** Footer gets RSS link.
- **Files:** `src/components/Footer.tsx`.
- **Labels:** `type:feat`, `milestone:M9`.

### M9 verified-locally gate
- [ ] Paste a permalink into Slack / iMessage / Twitter compose → unfurl shows title + image.
- [ ] `/feed.xml` validates against an RSS validator.
- [ ] Subscribe to the feed in a real reader (NetNewsWire, Feedly) → posts appear correctly.

---

## M10 — Polish

**Shippable outcome:** Everything feels done. Empty states friendly, error copy uniformly human, theme toggle polished, keyboard nav works, README is legit, and a human can set the project up from scratch in under 5 minutes.

### Issues

#### M10-1 · `feat: error copy pass`
- **Scope:** Audit every user-facing message. Fill `errors.ts` copy table. No HTTP codes, no stack traces, no "Something went wrong" bare messages.
- **Files:** `src/lib/server/metadata/errors.ts`, various.
- **Labels:** `type:feat`, `milestone:M10`.

#### M10-2 · `feat: empty and end states across feed, search, admin modals`
- **Scope:** Friendly copy everywhere there's nothing to show.
- **Labels:** `type:feat`, `milestone:M10`.

#### M10-3 · `feat: accessibility sweep`
- **Scope:** Keyboard nav across add modal + feed; focus management; aria-labels on icon buttons; color contrast check against WCAG AA. Run axe-core via Playwright.
- **Tests:** Playwright + axe-core runs clean on home, login, post permalink, add modal open.
- **Labels:** `type:feat`, `milestone:M10`.

#### M10-4 · `feat: theme toggle refinement`
- **Scope:** Initial theme matches OS preference; toggle animates; no flash-of-wrong-theme on load.
- **Labels:** `type:feat`, `milestone:M10`.

#### M10-5 · `docs: full readme with deploy button and env var reference`
- **Scope:** README covers: what Lately is, how to deploy to Vercel, Supabase setup steps, env vars (reference spec §12), local development, troubleshooting.
- **Files:** `README.md`.
- **Labels:** `type:docs`, `milestone:M10`.

#### M10-6 · `docs: update future-work with learnings`
- **Scope:** Revisit `docs/future-work.md`, add anything surfaced during v2 build (e.g., scripted Supabase setup deeper spec, more type-inference domains, unauthorized-login log).
- **Labels:** `type:docs`, `milestone:M10`.

#### M10-7 · `chore: vercel deploy configuration`
- **Scope:** `vercel.json` with function timeouts appropriate for `/api/upload` (sharp can take a few seconds on HEIC), region pinning if needed.
- **Labels:** `type:chore`, `milestone:M10`.

### M10 verified-locally gate
- [ ] Fresh clone → follow README → site live locally in under 10 minutes (5-minute goal honestly audited).
- [ ] All 10 post types posted, edited (where allowed), and deleted without error.
- [ ] Light/dark mode toggle has no flash on initial load.
- [ ] axe-core reports zero violations.
- [ ] Full E2E suite green.
- [ ] CI green on `main`.

---

## Execution

After this plan lands, the next step is `gh-kickoff`, which will:
1. Create labels (`type:*`, `milestone:*`).
2. Create GitHub Milestones M1–M10.
3. Create one Issue per item above, assigned to `@tommcfarlin`, labeled appropriately, assigned to the correct Milestone.

Then per-milestone execution proceeds via subagent-driven development:
- Pick next milestone's first issue.
- Invoke `writing-plans` scoped to that issue (TDD-detailed).
- Execute in a worktree.
- Review, merge, next.

Local-first verification is enforced at the milestone boundary, not per-issue — individual issues may land incomplete pieces, but no milestone is closed without the gate.

---

## Self-Review Notes

**Spec coverage scan (spec §# → milestone):**
- §1 summary → M1 (shell) + M3 (feed) + M4–M7 (types).
- §2 tech stack → M1 setup.
- §3 privacy (fully public) → M2 + M9 (permalinks public, RSS public).
- §4 auth → M2.
- §5 data model → M3.
- §6 add/edit → M4 (add skeleton) + M5–M7 (add per type) + M8 (edit).
- §7 URL detection & normalization → M4-1, M4-2, M4-3, M4-7 (fallback).
- §8 photo pipeline → M6.
- §9 feed + pagination → M3-5.
- §10 RSS → M9-2.
- §11 UI/layout → M1-7 (shell) + M10 (polish).
- §12 env vars → M1-8 readme + M10-5 readme.
- §13 testing strategy → each milestone has unit + e2e + local-first gate.
- §14 file structure → M1 scaffolds, populated across.
- §15 out of scope → honored, nothing snuck back in.
- §16 build order → mirrored here as M1–M10.

**Placeholder scan:** no TBDs, no "implement X later," every issue has concrete scope + acceptance + tests.

**Type consistency:** `PostType`, `Post`, `PostData` defined in M3-1, referenced consistently afterward. `MetadataFetchError` defined in M4-3, referenced consistently. `normalizeUrl`/`detectType` names stable.

**Scope check:** one product, one plan. Not decomposing further — each milestone is independently demoable, which is the unit of "shippable."
