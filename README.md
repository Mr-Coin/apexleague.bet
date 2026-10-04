# APEX Fantasy Football League — League Hub

The private website for the APEX league: rules, teams, keepers, history, proposals, and the
Weekly Loser's Parlay. Lives at https://apexleague.bet.

## Stack

- **Frontend:** React 19, react-router 8, Tailwind CSS 4, shadcn/ui primitives, Vite 8 — `src/`
- **Backend:** Cloudflare Worker (Hono) with D1/SQLite — `worker/`
- **Shared:** pure parlay model and week math used by both — `shared/`
- **Hosting/deploy:** one Worker serving the SPA as static assets; GitHub Actions deploys `main`

See [RUNBOOK.md](RUNBOOK.md) for hosting, secrets, deploys, data import and recovery.

## Develop

```sh
npm install
cp .dev.vars.example .dev.vars   # local secrets; edit the password/PIN if you like
npm run db:migrate:local         # creates the local D1 schema
npm run dev                      # http://localhost:5173
```

`npm run check` runs everything CI runs: typecheck, lint, tests, build. Formatting is Prettier
(`npm run format`).

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with the Worker running locally (Miniflare) |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run typecheck` | `tsc -b` across app, worker and config projects |
| `npm run lint` | ESLint (flat config) |
| `npm run build` | Production build to `dist/` (client + worker) |
| `npm run db:migrate:local` | Apply `migrations/` to the local D1 |

Node 22 LTS (`.node-version`). Secrets never go in the repo — only `.dev.vars.example`.

## Project layout

```
src/
  App.tsx                 routes + auth gate
  components/             page sections (RulesSection, TeamsSection, …) and parlay/
  components/ui/          shadcn primitives actually in use
  config/                 editable league content (teams, proposals, draft, popup)
  lib/                    api client, auth context, popup store
shared/parlay/            markets, grading math, week boundaries (client + worker)
worker/
  index.ts                fetch/scheduled entry; mounts /api
  auth.ts, session.ts     password login, commissioner PIN, signed cookie
  assets.ts               gates private static files behind the session
  parlay/                 ESPN/odds providers, settlement, history, routes
migrations/               D1 schema (applied by CI)
test/                     Vitest suites
docs/                     content-editing guides for non-developers
```

## Editing league content

Team blurbs, photos, proposals and draft notices are TypeScript config in `src/config/`.
Non-developers: start with [docs/editing-teams.md](docs/editing-teams.md),
[docs/editing-proposals.md](docs/editing-proposals.md), [docs/editing-draft.md](docs/editing-draft.md).
Images go in `public/`. Open a PR; merging deploys.

## Contributing

Branch → PR → green CI → review by the other maintainer → merge to `main` (auto-deploys).
Keep behaviour changes and content changes in separate PRs when you can.

## Credits

Site by Cole Thomas. Weekly Loser's Parlay by Stuart Alvey (originally hosted standalone;
integrated here in October 2026).
