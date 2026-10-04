import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Game } from "#shared/parlay/model";
import { putCache } from "../../worker/parlay/cache";
import { fakeD1 } from "./fake-d1";
import { client, json, testEnv } from "./helpers";

const fixed = Date.parse("2026-09-24T14:00:00Z"); // 2026 Week 3, before Sunday lock
const db = fakeD1(() => fixed);
const env = testEnv(db);

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
  market: "spreads",
  player: "",
  side: "Indianapolis Colts",
  line: -3.5,
  odds: -110,
  book: "Book",
  source: "manual",
  sourceTime: fixed,
};

beforeAll(async () => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", async () => new Response("Forbidden", { status: 403 }));
  await putCache(db, "league:2026", league);
  await putCache(db, "games:2026:3", [game]);
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  db.close();
});

describe("parlay routes", () => {
  it("requires a session", async () => {
    const anon = await client(env, null);
    expect((await anon.get()).status).toBe(401);
    expect((await json(await anon.get())).error).toBe("Sign in to view the parlay.");
    expect((await anon.post({ action: "pick" })).status).toBe(401);
    expect((await anon.post({}, "/api/parlay/settle")).status).toBe(401);
  });

  it("returns the week state with ESPN disconnected and the previous-week funder", async () => {
    const c = await client(env);
    const r = await c.get("?season=2026&week=3");
    expect(r.status).toBe(200);
    const d = await json<Record<string, unknown>>(r);
    expect(d).toMatchObject({
      season: 2026,
      week: 3,
      activeWeek: 3,
      locked: false,
      scheduleError: "",
      connections: { espn: false, odds: false },
      user: { name: "", admin: false, teamId: null },
      credits: 0,
      allTime: null,
      performance: null,
      availableSeasons: [2026, 2025],
    });
    expect((d.league as { teams: unknown[] }).teams.length).toBe(2);
    expect((d.games as Game[])[0].id).toBe("g1");
    expect(d.funder).toMatchObject({ ids: [901], score: 80, tie: false, names: "Alex One" });
    expect(d.deadline).toBe(Date.parse("2026-09-27T17:00:00Z"));
  });

  it("omits member emails unless the session is a commissioner", async () => {
    db.sql.prepare("INSERT INTO members(email,team_id,name) VALUES(?,?,?)").run("one@apex.test", 901, "One");
    const member = await json<{ members: Record<string, unknown>[] }>(
      await (await client(env)).get("?season=2026&week=3"),
    );
    expect(member.members[0]).toEqual({ name: "One", team_id: 901 });
    const admin = await json<{ members: Record<string, unknown>[]; user: { admin: boolean } }>(
      await (await client(env, "commissioner")).get("?season=2026&week=3"),
    );
    expect(admin.members[0].email).toBe("one@apex.test");
    expect(admin.user.admin).toBe(true);
  });

  it("validates picks with Stu's messages", async () => {
    const c = await client(env);
    const post = (body: Record<string, unknown>) => c.post({ season: 2026, week: 3, ...body });
    const err = async (body: Record<string, unknown>) => (await json(await post(body))).error;

    expect(await err({ action: "pick", team: "bad team", pick: base })).toBe(
      "Enter an APEX team name or ID from the scoreboard.",
    );
    expect(await err({ action: "pick", team: "901", pick: { ...base, side: "Dallas Cowboys" } })).toBe(
      "Select a team in this game.",
    );
    expect(
      await err({ action: "pick", team: "901", pick: { ...base, market: "totals", side: "Over", line: null } }),
    ).toBe("A line is required.");
    expect(
      await err({ action: "pick", team: "901", pick: { ...base, market: "totals", side: "Sideways", line: 40 } }),
    ).toBe("Choose Over or Under.");
    expect(
      await err({
        action: "pick",
        team: "901",
        pick: { ...base, market: "player_receptions", side: "Over", line: 4.5 },
      }),
    ).toBe("Player name is required.");
    expect(
      await err({
        action: "pick",
        team: "901",
        pick: { ...base, market: "player_anytime_td", player: "X", side: "Over", line: null },
      }),
    ).toBe("Anytime touchdown picks must be Yes.");
    expect(await err({ action: "pick", team: "901", pick: { ...base, eventId: "nope" } })).toBe(
      "Choose an upcoming non-Thursday game in this week.",
    );
    expect(await err({ action: "pick", team: "901", pick: { ...base, odds: 50 } })).toBe(
      "Please check all required fields.",
    );
    expect(await err({ season: 2026, week: 4, action: "pick", team: "901", pick: base })).toBe(
      "Picks are only accepted for the active APEX week.",
    );
    expect(await err({ action: "grade", id: "x", result: "won", reason: "Test" })).toBe("Commissioner only.");
    expect(await err({ action: "nope" })).toBe("Unknown action.");

    // Happy path, duplicate detection, delete.
    expect((await post({ action: "pick", team: "901", pick: base })).status).toBe(200);
    expect(await err({ action: "pick", team: "Team Two", pick: base })).toBe(
      "That exact leg has already been selected.",
    );
    expect(
      (await post({ action: "pick", team: "Team Two", pick: { ...base, market: "totals", side: "Over", line: 40.5 } }))
        .status,
    ).toBe(200);
    const s = await json<{ picks: { team_id: number }[]; history: unknown[] }>(await c.get("?season=2026&week=3"));
    expect(s.picks.map((p) => p.team_id).sort()).toEqual([901, 902]);
    expect(s.history.length).toBe(2);
    expect((await post({ action: "deletePick", team: "901" })).status).toBe(200);
    expect(await err({ action: "deletePick", team: "901" })).toBe(
      "Pick could not be deleted. It may be locked or already removed.",
    );
  });

  it("lets a commissioner grade and rejects cross-site writes", async () => {
    const admin = await client(env, "commissioner");
    const id = (db.sql.prepare("SELECT id FROM picks").get() as { id: string }).id;
    expect(
      (await admin.post({ season: 2026, week: 3, action: "grade", id, result: "won", reason: "Sportsbook" })).status,
    ).toBe(200);
    expect(db.sql.prepare("SELECT result,actual FROM picks").get() as { result: string; actual: string }).toEqual({
      result: "won",
      actual: "Commissioner: Sportsbook",
    });
    const cookie = (await import("./helpers")).cookieFor;
    const r = await (
      await import("../../worker/index")
    ).default.fetch(
      new Request("https://test.invalid/api/parlay", {
        method: "POST",
        headers: { cookie: await cookie("member"), "Content-Type": "application/json", Origin: "https://evil.example" },
        body: "{}",
      }),
      env,
      { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext,
    );
    expect(r.status).toBe(403);
  });

  it("settlement trigger reports and respects its lease", async () => {
    const c = await client(env);
    expect(await json(await c.get("/settle"))).toMatchObject({ method: "POST" });
    const first = await c.post({}, "/api/parlay/settle");
    // Week 2 backfill cannot verify members against the fake league, so the run reports failure.
    expect(first.status).toBe(503);
    const again = await json<{ skipped?: boolean }>(await c.post({}, "/api/parlay/settle"));
    expect(again.skipped).toBe(true);
  });
});
