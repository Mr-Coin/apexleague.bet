// Route branches beyond the core pick flow: query validation, odds lookup, stats, members, locks.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "#shared/parlay/model";
import { putCache } from "../../worker/parlay/cache";
import { fakeD1 } from "./fake-d1";
import worker from "../../worker/index";
import { client, cookieFor, json, testEnv } from "./helpers";

const ctx = { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext;

const fixed = Date.parse("2026-09-24T14:00:00Z"); // Thursday of 2026 Week 3
let now = fixed;
const db = fakeD1(() => now);
const env = { ...testEnv(db), ODDS_API_KEY: "key" };

const game: Game = {
  id: "g1",
  name: "HOU @ IND",
  home: "Indianapolis Colts",
  away: "Houston Texans",
  date: "2026-09-27T17:00:00Z",
  completed: false,
  state: "Scheduled",
  homeScore: 0,
  awayScore: 0,
};
const thursday: Game = { ...game, id: "thu", name: "TNF", date: "2026-09-24T23:15:00Z" };
const early: Game = { ...game, id: "early", name: "London", date: "2026-09-27T13:30:00Z" };
const league = {
  peopleVersion: 1,
  previousSeasons: [2025],
  teams: [
    { id: 901, name: "Team One", personName: "Alex One", ownerKey: "one" },
    { id: 902, name: "Team Two", personName: "Sam Two", ownerKey: "two" },
  ],
  matchups: [{ id: 1, week: 2, home: { id: 901, score: 80 }, away: { id: 902, score: 90 } }],
  week: 3,
  scoringPeriod: 3,
  periods: { "2": [2] },
};
const base = {
  eventId: game.id,
  market: "h2h",
  player: "",
  side: "Indianapolis Colts",
  line: null,
  odds: -110,
  book: "Book",
  source: "manual",
  sourceTime: fixed,
};
let provider: (url: string) => Response = () => new Response("down", { status: 503 });

beforeAll(async () => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", (u: string | URL | Request) => provider(String(u instanceof Request ? u.url : u)));
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  db.close();
});
beforeEach(async () => {
  now = fixed;
  vi.setSystemTime(fixed);
  provider = () => new Response("down", { status: 503 });
  db.sql.exec("DELETE FROM cache; DELETE FROM picks; DELETE FROM members; DELETE FROM usage;");
  await putCache(db, "league:2026", league);
  await putCache(db, "games:2026:3", [game, thursday, early]);
});

describe("GET /api/parlay", () => {
  it("validates season and week", async () => {
    const c = await client(env);
    expect(await json(await c.get("?season=abc"))).toEqual({ error: "Invalid season" });
    expect(await json(await c.get("?season=1999"))).toEqual({ error: "Invalid season" });
    expect(await json(await c.get("?season=2026&week=99"))).toEqual({ error: "Please check all required fields." });
  });

  it("reports a schedule outage instead of failing the whole page", async () => {
    const d = await json<{ games: unknown[]; scheduleError: string }>(
      await (await client(env)).get("?season=2026&week=9"),
    );
    expect(d.games).toEqual([]);
    expect(d.scheduleError).toBe("NFL schedule is unavailable. Please try again shortly.");
  });

  it("serves a past season using the current league for available seasons", async () => {
    const d = await json<{ availableSeasons: number[]; league: { teams: unknown[]; error?: string } }>(
      await (await client(env)).get("?season=2025&week=1"),
    );
    expect(d.availableSeasons).toEqual([2026, 2025]);
    expect(d.league.teams).toEqual([]);
    expect(d.league.error).toBe("Connect ESPN to load APEX scores.");
  });

  it("looks up odds only for upcoming non-Thursday games", async () => {
    const c = await client(env);
    const err = async (q: string) => (await json(await c.get(q))).error;
    expect(await err("?season=2026&week=3&action=odds&event=nope")).toBe("Choose an upcoming non-Thursday game.");
    expect(await err("?season=2026&week=3&action=odds&event=thu")).toBe("Choose an upcoming non-Thursday game.");
    expect(await err("?season=2026&week=3&action=odds&event=g1")).toBe("Data provider unavailable (503).");
    provider = (url) =>
      Response.json(
        url.includes("/events?")
          ? [{ id: "ev", home_team: game.home, away_team: game.away, commence_time: game.date }]
          : {
              id: "ev",
              home_team: game.home,
              away_team: game.away,
              bookmakers: [
                {
                  key: "draftkings",
                  title: "DraftKings",
                  markets: [
                    {
                      key: "player_receptions",
                      outcomes: [{ name: "Over", description: "Josh Downs", point: 4.5, price: -120 }],
                    },
                  ],
                },
              ],
            },
      );
    const d = await json<{ options: { player: string }[]; book: string }>(
      await c.get("?season=2026&week=3&action=odds&event=g1"),
    );
    expect(d.book).toBe("DraftKings");
    expect(d.options[0].player).toBe("Josh Downs");
    const page = await json<{ credits: number }>(await c.get("?season=2026&week=3"));
    expect(page.credits).toBe(2);
  });

  it("adds all-time and betting stats on request, exposing only hashed owner keys", async () => {
    db.sql
      .prepare("INSERT INTO picks(id,season,week,team_id,user_id,data,result,updated) VALUES(?,2026,3,901,'u',?,?,?)")
      .run("p1", JSON.stringify({ ...base, kickoff: game.date, game: game.name }), "won", fixed);
    const d = await json<{
      allTime: { leaders: unknown[]; seasons: number[]; unavailable: number[] };
      performance: {
        leaders: { key: string; name: string; wins: number }[];
        estimatedLeaders: { key: string }[];
        picks: number;
      };
    }>(await (await client(env)).get("?season=2026&week=3&stats=1"));
    expect(d.allTime).toMatchObject({ seasons: [2026], unavailable: [2025] });
    expect(d.performance.picks).toBe(1);
    expect(d.performance.leaders[0]).toMatchObject({ name: "Alex One", wins: 1 });
    expect(d.performance.leaders[0].key).toMatch(/^[0-9a-f]{16}$/);
    expect(d.performance.leaders[0].key).not.toBe("one");
    expect(d.performance.estimatedLeaders[0].key).toBe(d.performance.leaders[0].key);
  });
});

describe("POST /api/parlay", () => {
  it("rejects oversized bodies", async () => {
    const c = await client(env);
    const r = await worker.fetch(
      new Request("https://test.invalid/api/parlay", {
        method: "POST",
        headers: {
          cookie: await cookieFor("member"),
          "Content-Type": "application/json",
          "Content-Length": "20001",
          Origin: "https://test.invalid",
        },
        body: "{}",
      }),
      env,
      ctx,
    );
    expect(await r.json()).toEqual({ error: "Request is too large." });
    expect((await c.post({ season: 2026, week: 3, action: "nope" })).status).toBe(400);
  });

  it("lets only a commissioner map members to verified teams", async () => {
    const member = await client(env);
    const admin = await client(env, "commissioner");
    const body = { action: "member", email: "One@Apex.test", name: "One", teamId: 901 };
    expect(await json(await member.post(body))).toEqual({ error: "Commissioner only." });
    expect(await json(await admin.post({ ...body, teamId: 999 }))).toEqual({ error: "Select a verified APEX team." });
    expect(await json(await admin.post({ ...body, email: "not-an-email" }))).toEqual({
      error: "Please check all required fields.",
    });
    expect((await admin.post(body)).status).toBe(200);
    expect((await admin.post({ ...body, name: "Renamed", teamId: 902 })).status).toBe(200);
    expect(db.sql.prepare("SELECT email,name,team_id FROM members").all()).toEqual([
      { email: "one@apex.test", name: "Renamed", team_id: 902 },
    ]);
  });

  it("refuses Thursday games and ambiguous team names", async () => {
    const c = await client(env);
    const err = async (body: Record<string, unknown>) =>
      (await json(await c.post({ season: 2026, week: 3, ...body }))).error;
    expect(await err({ action: "pick", team: "901", pick: { ...base, eventId: "thu" } })).toBe(
      "Choose an upcoming non-Thursday game in this week.",
    );
    expect(await err({ action: "pick", team: "", pick: base })).toBe(
      "Enter an APEX team name or ID from the scoreboard.",
    );
    expect(await err({ action: "pick", team: "team one", pick: base })).toBeUndefined();
    expect(
      await err({ action: "pick", team: "901", pick: { ...base, market: "spreads", side: game.away, line: 3.5 } }),
    ).toBeUndefined();
  });

  it("validates a commissioner grade and records the reason", async () => {
    const admin = await client(env, "commissioner");
    db.sql
      .prepare("INSERT INTO picks(id,season,week,team_id,user_id,data,updated) VALUES(?,2026,3,901,'u',?,?)")
      .run("p1", JSON.stringify({ ...base, kickoff: game.date, game: game.name }), fixed);
    expect(
      await json(await admin.post({ season: 2026, week: 3, action: "grade", id: "p1", result: "won", reason: "x" })),
    ).toEqual({
      error: "Please check all required fields.",
    });
    expect(
      await json(
        await admin.post({ season: 2026, week: 3, action: "grade", id: "p1", result: "maybe", reason: "Reason" }),
      ),
    ).toEqual({
      error: "Please check all required fields.",
    });
    expect(
      (await admin.post({ season: 2026, week: 3, action: "grade", id: "p1", result: "void", reason: "Inactive" }))
        .status,
    ).toBe(200);
    expect(db.sql.prepare("SELECT result,actual FROM picks WHERE id='p1'").get()).toEqual({
      result: "void",
      actual: "Commissioner: Inactive",
    });
  });

  it("locks the slip at the Sunday deadline and once a chosen game has kicked off", async () => {
    const c = await client(env);
    const post = (body: Record<string, unknown>) => c.post({ season: 2026, week: 3, ...body });
    expect((await post({ action: "pick", team: "901", pick: { ...base, eventId: "early" } })).status).toBe(200);
    now = Date.parse("2026-09-27T14:00:00Z"); // London game underway, before the 1 p.m. ET lock
    vi.setSystemTime(now);
    expect(await json(await post({ action: "pick", team: "901", pick: base }))).toEqual({
      error: "This pick has started and cannot be changed or deleted.",
    });
    expect(await json(await post({ action: "deletePick", team: "901" }))).toEqual({
      error: "This pick has started and cannot be changed or deleted.",
    });
    expect((await post({ action: "pick", team: "902", pick: base })).status).toBe(200);
    now = Date.parse("2026-09-27T17:00:00Z");
    vi.setSystemTime(now);
    expect(await json(await post({ action: "pick", team: "902", pick: base }))).toEqual({
      error: "Picks are locked at Sunday 1 p.m. Eastern.",
    });
    const d = await json<{ locked: boolean; picks: unknown[] }>(await c.get("?season=2026&week=3"));
    expect(d.locked).toBe(true);
    expect(d.picks).toHaveLength(2);
  });
});

describe("settlement trigger", () => {
  it("treats a cross-site POST as a failed check rather than a rejection", async () => {
    const r = await worker.fetch(
      new Request("https://test.invalid/api/parlay/settle", {
        method: "POST",
        headers: { cookie: await cookieFor("member"), Origin: "https://evil.example" },
      }),
      env,
      ctx,
    );
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ ok: false, error: "Settlement check failed; retry later." });
  });
});
