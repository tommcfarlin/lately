# Future Work

Items deferred from v1. Not commitments — just captured so they aren't lost.

## Scripted Supabase setup

Manual Supabase configuration (create table, create `photos` bucket, apply RLS) is the most friction-heavy part of self-hosting. Worth automating post-v1.

**Scriptable today:**
- Schema, RLS, indexes — via `supabase/migrations/*.sql` and the Supabase CLI (`supabase db push`), or a one-shot bootstrap route run with the service-role key.
- Storage bucket creation — `supabase.storage.createBucket('photos', { public: true })`.

**Not cleanly scriptable:**
- Creating the Supabase *project* itself requires a Personal Access Token + org ID via the Management API. Trading a dashboard click for a PAT paste is often worse UX, not better.

**Proposed approach:**
A `scripts/setup.ts` (or `/api/bootstrap` gated by a one-time setup secret) that, given the service-role key, applies migrations and creates the `photos` bucket. Collapses the manual checklist from ~4 steps to 1.
