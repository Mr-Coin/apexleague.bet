# Operations Runbook

How apexleague.bet is hosted, deployed and recovered. Read this before touching production.

## Architecture in one paragraph

A single Cloudflare Worker (`worker/`) serves the React SPA (`src/`) as static assets and
handles `/api/*`. Members sign in with the shared league password; the Worker issues an
HMAC-signed, HttpOnly session cookie. A separate commissioner PIN elevates a session for
grading overrides. Parlay data lives in a D1 (SQLite) database; every 15 minutes a cron
trigger grades pending legs against ESPN box scores. Deploys happen from GitHub Actions
when `main` changes — nobody deploys from a laptop.

```
browser ──▶ Worker ──┬─▶ /api/auth/*      session cookie (worker/auth.ts)
                     ├─▶ /api/parlay/*    picks, odds, settlement (worker/parlay/)
                     └─▶ static assets    SPA shell is public; everything else needs a session
                                 │
                       D1 "apex-league"  ◀── cron */15 * * * * (settlement)
```

## One-time setup (done 2026-10-02 unless marked TODO)

| Step | Status |
|---|---|
| Cloudflare account (Cole) | done — account id `684966fd930df89179a9e8c11975b0f4` |
| `wrangler d1 create apex-league` | done — id in `wrangler.jsonc` |
| Secrets (`wrangler secret put …`, see list below) | **TODO** |
| GitHub repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | **TODO** |
| GitHub environment `production` (optional: require Cole or Stu to approve deploys) | **TODO** |
| Move `apexleague.bet` DNS from GoDaddy to Cloudflare, add custom domain to the Worker | **TODO** (cutover) |
| Import Stu's D1 export | **TODO** (cutover) |
| Disable GitHub Pages on the repo | **TODO** (after cutover) |

### Secrets

Set each with `npx wrangler secret put NAME` (prompts for the value; never paste secrets into chat, commits or issues).

| Name | What | Who has it |
|---|---|---|
| `LEAGUE_PASSWORD` | The password members already type on the lock screen | Cole |
| `COMMISSIONER_PIN` | New, 6+ characters. Unlocks grading overrides in the header ⚙️ menu (3 attempts/min/IP) | Cole / commissioner |
| `SESSION_SECRET` | `openssl rand -hex 32`. Sessions are stateless, so rotating this is the only way to revoke them (signs everyone out) | generate once |
| `ESPN_S2`, `ESPN_SWID` | Private ESPN fantasy cookies of a league-manager account | Stu |
| `ODDS_API_KEY` | Optional, the-odds-api.com. Manual odds entry works without it | Stu |

### Cloudflare API token for CI

Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template,
scoped to this account. Add **D1:Edit** so the deploy job can run migrations. Store as the
GitHub repository secret `CLOUDFLARE_API_TOKEN`; store the account id as `CLOUDFLARE_ACCOUNT_ID`.

## Everyday workflow (Cole and Stu)

1. Branch from `main`, work locally with `npm run dev` (http://localhost:5173). First time: `cp .dev.vars.example .dev.vars`, then `npm run db:migrate:local`.
2. `npm run check` before pushing (typecheck, lint, tests, build) — CI runs the same.
3. Open a PR. CI must be green; one review from the other collaborator is the norm.
4. Merge to `main` → GitHub Actions applies D1 migrations and deploys. Live in ~1 minute.

Content edits (team blurbs, proposals, keepers) are plain TypeScript config in `src/config/` —
see `docs/editing-*.md`. They go through the same PR → deploy path.

## Database

- Schema changes: add `migrations/NNNN_description.sql`. CI applies pending migrations before deploying. Never edit an applied migration.
- Local inspection: `npx wrangler d1 execute apex-league --local --command "SELECT result, COUNT(*) FROM picks GROUP BY result"`.
- Production inspection (read-only queries only): same command with `--remote`.
- Backup: `npx wrangler d1 export apex-league --remote --output backups/apex-league-$(date +%F).sql` (keep backups out of git; `backups/` is not tracked).

### Importing Stu's data (cutover)

1. Stu exports from the old Site: a SQL dump of `members`, `picks`, `rounds`, `usage` (the `cache` table is disposable — do **not** import it; it holds a stale settlement lease and ESPN snapshots that will rebuild).
2. Review the dump: no `cache` rows, no credentials, member emails are present in `members` only (that table is fine in D1 — it never enters the repo).
3. Dry-run locally: `npx wrangler d1 execute apex-league --local --file path/to/dump.sql`, then `npm run dev` and compare week history against the live Site.
4. Production: `npx wrangler d1 execute apex-league --remote --file path/to/dump.sql`.
5. Verify counts: `SELECT season, week, COUNT(*) FROM picks GROUP BY 1,2` matches the old app.

If the dump is unavailable, the fixed 2026 Week 2 backfill (`worker/parlay/week2-backfill.ts`) recreates
Week 2 on the first settlement run; weeks 3+ would need manual re-entry.

## Cutover checklist

1. Secrets set, CI secrets set, a push to `main` has deployed successfully to the `*.workers.dev` URL. Test login, parlay read, pick save, commissioner PIN there.
2. Coordinate with Stu: brief write-pause on the old Site, final export, import (above).
3. DNS: in Cloudflare add site `apexleague.bet`, change nameservers at GoDaddy to the two Cloudflare assigns. Then Worker → Settings → Domains & Routes → add `apexleague.bet` and `www.apexleague.bet`.
4. Confirm `https://apexleague.bet` serves the new site; GitHub Pages can be disabled in repo settings.
5. Stu retires the ChatGPT settlement trigger; the Worker cron replaces it. Keep the old Site read-only for a couple of weeks as rollback.

## Operating the parlay

- Settlement runs automatically (cron) and whenever anyone loads the parlay page. `POST /api/parlay/settle` can be called manually from a signed-in session; it is idempotent and lease-protected (5 min). Until ESPN credentials are set it reports `backfill:2026:2` as deferred but still grades other weeks.
- A leg stuck in "pending" or "review" after a game ends needs the commissioner: header ⚙️ → enter PIN → "Review result" on the leg. Give a reason; it is stored for the audit trail.
- ESPN cookies expire (roughly yearly). Symptom: parlay page shows "Connect ESPN". Fix: Stu re-captures `espn_s2`/`SWID` from a logged-in browser, `wrangler secret put` both.
- Odds API quota: 450 credits/month enforced in `usage`. Running out just disables the "Browse odds" tab; manual entry still works.

## Rollback

- Bad deploy: Cloudflare dashboard → Workers → apexleague-bet → Deployments → "Rollback" to the previous version (instant), or `git revert` + merge.
- Bad migration: there is no automatic down-migration. Restore from the latest `wrangler d1 export` backup into a fresh database and repoint `database_id`.

## Monitoring

- Worker logs/traces: dashboard → Workers → apexleague-bet → Observability (enabled in `wrangler.jsonc`). `npx wrangler tail` streams live logs.
- Last settlement result is stored in `cache` under `settlement:last`.
