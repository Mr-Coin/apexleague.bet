import type { AppEnv } from "../env";
import { putCache } from "./cache";
import { games, grade, league } from "./espn";
import { backfillWeek2 } from "./week2-backfill";

export interface SettlementReport {
  ok: boolean;
  checkedAt: string;
  weeksChecked: number;
  errors: string[];
  counts: { result: string; count: number }[];
}

export type SettlementOutcome =
  | { status: 200; body: SettlementReport | { ok: true; skipped: true; reason: string } }
  | { status: 503; body: SettlementReport | { ok: false; error: string } };

/**
 * Grade every pending week from provider results. Shared by the public POST
 * trigger and the cron; never accepts caller-supplied grades.
 */
export async function runSettlement(env: AppEnv): Promise<SettlementOutcome> {
  try {
    const db = env.DB;
    // An atomic lease bounds requests and concurrent retries to once per five minutes.
    const now = Date.now();
    const lock = await db
      .prepare(
        "INSERT INTO cache(id,data,updated) VALUES('settlement:lease','{}',?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated WHERE cache.updated<?",
      )
      .bind(now, now - 300000)
      .run();
    if (!lock.meta.changes)
      return {
        status: 200,
        body: { ok: true, skipped: true, reason: "A settlement check ran recently. Retry after five minutes." },
      };
    await backfillWeek2(db, await league(env, 2026), await games(db, 2026, 2));
    const weeks = await db
      .prepare("SELECT season,week FROM picks WHERE result='pending' GROUP BY season,week ORDER BY season,week")
      .all<{ season: number; week: number }>();
    const errors: string[] = [];
    for (const w of weeks.results) {
      try {
        await grade(db, w.season, w.week, await games(db, w.season, w.week));
      } catch {
        errors.push(w.season + ":" + w.week);
      }
    }
    const counts = await db
      .prepare("SELECT result,COUNT(*) AS count FROM picks GROUP BY result")
      .all<{ result: string; count: number }>();
    const result: SettlementReport = {
      ok: errors.length === 0,
      checkedAt: new Date().toISOString(),
      weeksChecked: weeks.results.length,
      errors,
      counts: counts.results,
    };
    await putCache(db, "settlement:last", result);
    return errors.length ? { status: 503, body: result } : { status: 200, body: result };
  } catch {
    return { status: 503, body: { ok: false, error: "Settlement check failed; retry later." } };
  }
}
