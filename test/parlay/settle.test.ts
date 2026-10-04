// The settlement run shared by the cron and the POST trigger: lease, per-week isolation, reporting.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cached, putCache } from "../../worker/parlay/cache";
import { runSettlement, type SettlementReport } from "../../worker/parlay/settle";
import type { AppEnv } from "../../worker/env";
import { fakeD1 } from "./fake-d1";
import { testEnv } from "./helpers";

const fixed = Date.parse("2026-09-28T16:00:00Z");
const db = fakeD1(() => fixed);
const env = testEnv(db);
const MARKER = "backfill:2026:2:confirmed-ticket-v1";

const game = {
  id: "401",
  name: "HOU @ IND",
  home: "Indianapolis Colts",
  away: "Houston Texans",
  date: "2026-09-27T17:00Z",
  completed: true,
  state: "Final",
  homeScore: 24,
  awayScore: 17,
};
let team = 900;
const insert = (season: number, week: number, data: Record<string, unknown>) =>
  db.sql
    .prepare("INSERT INTO picks(id,season,week,team_id,user_id,data,updated) VALUES(?,?,?,?,?,?,?)")
    .run(crypto.randomUUID(), season, week, ++team, "u", JSON.stringify(data), fixed);

beforeAll(() => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", async () => new Response("down", { status: 503 }));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  db.close();
});
beforeEach(() => db.sql.exec("DELETE FROM cache; DELETE FROM picks;"));

describe("runSettlement", () => {
  it("grades every pending week and stores a clean report once the backfill is confirmed", async () => {
    await putCache(db, MARKER, { approved: true });
    await putCache(db, "games:2026:3", [game]);
    insert(2026, 3, { eventId: "401", market: "h2h", side: "Indianapolis Colts", line: null, player: "" });
    insert(2026, 3, { eventId: "401", market: "totals", side: "Over", line: 40.5, player: "" });
    const r = await runSettlement(env);
    expect(r.status).toBe(200);
    const body = r.body as SettlementReport;
    expect(body).toMatchObject({ ok: true, weeksChecked: 1, errors: [], checkedAt: new Date(fixed).toISOString() });
    expect(body.counts).toEqual([{ result: "won", count: 2 }]);
    expect((await cached(db, "settlement:last"))?.data).toEqual(body);
  });

  it("isolates a week whose schedule cannot load and reports the deferred backfill", async () => {
    insert(2026, 9, { eventId: "x", market: "h2h", side: "Nobody", line: null, player: "" });
    const r = await runSettlement(env);
    expect(r.status).toBe(503);
    expect(r.body).toMatchObject({ ok: false, weeksChecked: 1, errors: ["backfill:2026:2", "2026:9"] });
    expect(db.sql.prepare("SELECT result FROM picks").get()).toEqual({ result: "pending" });
  });

  it("holds a five-minute lease across concurrent triggers", async () => {
    await putCache(db, MARKER, { approved: true });
    expect((await runSettlement(env)).status).toBe(200);
    expect(await runSettlement(env)).toEqual({
      status: 200,
      body: { ok: true, skipped: true, reason: "A settlement check ran recently. Retry after five minutes." },
    });
    db.sql.prepare("UPDATE cache SET updated=? WHERE id='settlement:lease'").run(fixed - 300001);
    const third = await runSettlement(env);
    expect(third.body).not.toHaveProperty("skipped");
    expect(third.body).toMatchObject({ weeksChecked: 0 });
  });

  it("never throws when the database itself is unavailable", async () => {
    const broken = {
      ...env,
      DB: {
        prepare() {
          throw new Error("D1 offline");
        },
      } as unknown as AppEnv["DB"],
    };
    expect(await runSettlement(broken)).toEqual({
      status: 503,
      body: { ok: false, error: "Settlement check failed; retry later." },
    });
  });
});
