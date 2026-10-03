# CLAUDE.md

Guidance for AI coding assistants working in this repo. Humans: see README.md and RUNBOOK.md.

## What this is

Private website for a 12-team fantasy football league, plus the "Weekly Loser's Parlay" app
(one leg per member per week, graded deterministically from ESPN box scores). One Cloudflare
Worker serves the React SPA and the `/api` routes; D1 is the database.

## Commands

- `npm run check` — typecheck + lint + test + build. Run before claiming anything works.
- `npm run dev` — local Worker + SPA (needs `.dev.vars`, copy from `.dev.vars.example`).
- `npm run db:migrate:local` — apply `migrations/` to the local D1.

## Layout and ownership

- `src/` React app. `src/config/` holds league *content* — treat text there as editorial; never "improve" wording.
- `worker/` Hono Worker. `worker/auth.ts` + `session.ts` are the whole auth system. `worker/parlay/` is the ported parlay backend.
- `shared/parlay/` pure logic imported by both sides via `#shared/parlay/...`.
- `migrations/` D1 SQL. Append new files; never edit applied ones.
- `test/` Vitest. The parlay grading/week/odds suites are the regression net for settlement — keep them green.

## Rules that matter here

- **Auth:** shared league password → member session; commissioner PIN → elevated session. Sessions are
  stateless HMAC cookies, no user identity. Any new write endpoint must `assertSameOrigin()` and check
  `c.get("session")`; commissioner-only actions check `session.role === "commissioner"`.
- **Secrets never enter the repo** (ESPN cookies, odds key, passwords, member emails). D1 holds member
  emails in the `members` table — fine there, never in code, fixtures or docs.
- **Settlement is deterministic.** Grades come only from ESPN results or an explicit commissioner override
  with a reason. Never add code paths that infer or guess a result. Ambiguous → stays pending/review.
- **Historical data is fixed.** `week2-backfill.ts`, `historical-odds.ts` and the Josh Downs label special case
  are approved league history; don't "clean them up".
- **Preserve user-facing copy** in parlay notices and league content unless the change is the task.
- Static assets other than the shell are gated by `worker/assets.ts`; if you add a file the lock screen
  itself needs, add it to the public allowlist there.

## Style

TypeScript strict, no `any` (type the slice of provider payloads you read), Prettier (`npm run format`),
ESLint flat config. Match the surrounding code's density and comment style; comments explain *why*.

## Deploy

Merging to `main` deploys via GitHub Actions. Don't run `wrangler deploy` from a laptop except for a
documented emergency in RUNBOOK.md. Don't create Cloudflare resources without asking.
