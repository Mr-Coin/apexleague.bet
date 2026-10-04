// ESPN provider adapter: fetch fallbacks, caching, league/scoreboard parsing and the grading loop.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, Pick } from "#shared/parlay/model";
import { cached, putCache } from "../../worker/parlay/cache";
import {
  bindPick,
  espnJson,
  eventSummary,
  funder,
  games,
  grade,
  jsonFetch,
  league,
  ProviderUnavailableError,
  seasonNow,
  verificationPending,
} from "../../worker/parlay/espn";
import { makeRule } from "../../worker/parlay/settlement";
import type { EspnSummary, LeagueState } from "../../worker/parlay/types";
import { fakeD1 } from "./fake-d1";
import { testEnv } from "./helpers";

const fixed = Date.parse("2026-09-28T16:00:00Z"); // Monday after 2026 Week 3
const db = fakeD1(() => fixed);
const env = { ...testEnv(db), ESPN_S2: "s2", ESPN_SWID: "{swid}" };

type Provider = (url: string) => Response | Promise<Response>;
let provider: Provider;
const calls: string[] = [];
const ok = (body: unknown) => () => Response.json(body);
const down = () => new Response("down", { status: 503 });

const game: Game = {
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
const base: Pick = {
  eventId: game.id,
  game: game.name,
  kickoff: game.date,
  market: "h2h",
  player: "",
  side: game.home,
  line: null,
  odds: -110,
  book: "Manual",
  source: "manual",
  sourceTime: fixed,
};
const summary = (over: Partial<EspnSummary> = {}): EspnSummary => ({
  header: {
    id: game.id,
    competitions: [
      {
        status: { type: { completed: true } },
        competitors: [
          { id: "11", homeAway: "home", score: "24" },
          { id: "34", homeAway: "away", score: "17" },
        ],
      },
    ],
  },
  boxscore: {
    players: [
      {
        team: { id: "11" },
        statistics: [
          {
            name: "receiving",
            keys: ["receivingYards", "receptions"],
            athletes: [{ athlete: { id: "4688813", displayName: "Josh Downs" }, stats: ["72", "7"] }],
          },
        ],
      },
    ],
  },
  ...over,
});

let seq = 0;
function seed(p: Pick, extra: Partial<{ result: string; actual: string | null }> = {}) {
  const id = "pick-" + ++seq;
  db.sql
    .prepare(
      "INSERT INTO picks(id,season,week,team_id,user_id,data,result,actual,updated) VALUES(?,2026,3,?,?,?,?,?,?)",
    )
    .run(id, 900 + seq, "u", JSON.stringify(p), extra.result ?? "pending", extra.actual ?? null, fixed);
  return id;
}
const row = (id: string) =>
  db.sql.prepare("SELECT result,actual,data FROM picks WHERE id=?").get(id) as {
    result: string;
    actual: string | null;
    data: string;
  };

beforeAll(() => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", (u: string | URL | Request) => {
    const url = String(u instanceof Request ? u.url : u);
    calls.push(url);
    return provider(url);
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  db.close();
});
beforeEach(() => {
  provider = down;
  calls.length = 0;
  db.sql.exec("DELETE FROM cache; DELETE FROM picks;");
});

describe("jsonFetch / espnJson", () => {
  it("wraps HTTP and network failures as provider errors", async () => {
    await expect(jsonFetch("https://x.invalid/a")).rejects.toThrow("Data provider unavailable (503).");
    provider = () => {
      throw new TypeError("socket hang up");
    };
    await expect(jsonFetch("https://x.invalid/a")).rejects.toBeInstanceOf(ProviderUnavailableError);
    await expect(jsonFetch("https://x.invalid/a")).rejects.toThrow("Data provider could not respond. Please retry.");
    provider = () => new Response("not json", { status: 200 });
    await expect(jsonFetch("https://x.invalid/a")).rejects.toThrow("Data provider could not respond. Please retry.");
    provider = ok({ fine: true });
    expect(await jsonFetch("https://x.invalid/a")).toEqual({ fine: true });
  });

  it("falls back to the alternate ESPN host and rethrows the last failure", async () => {
    provider = (url) => (url.includes("site.web.api") ? Response.json({ host: 2 }) : down());
    expect(await espnJson("/p")).toEqual({ host: 2 });
    expect(calls).toEqual(["https://site.api.espn.com/p", "https://site.web.api.espn.com/p"]);
    provider = down;
    await expect(espnJson("/p")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });
});

describe("seasonNow", () => {
  it("rolls the season over in March", () => {
    expect(seasonNow()).toBe(2026);
    vi.setSystemTime(Date.parse("2027-02-15T12:00:00Z"));
    expect(seasonNow()).toBe(2026);
    vi.setSystemTime(Date.parse("2027-03-01T12:00:00Z"));
    expect(seasonNow()).toBe(2027);
    vi.setSystemTime(fixed);
  });
});

describe("league", () => {
  const espn = {
    members: [
      { id: "{A}", firstName: "Alex", lastName: "One" },
      { id: "{B}", displayName: "sam_two" },
    ],
    teams: [
      { id: 1, owners: ["{B}", "{A}"], name: "Named", record: { overall: { wins: 2, losses: 1, pointsFor: 300 } } },
      { id: 2, location: "Loc", nickname: "Nick", playoffSeed: 4 },
      { id: 3 },
    ],
    schedule: [
      { id: 10, matchupPeriodId: 1, home: { teamId: 1, totalPoints: 100 }, away: { teamId: 2, totalPoints: 90 } },
    ],
    status: { previousSeasons: [2025, "bad", 2017, 2026], currentMatchupPeriod: 3, latestScoringPeriod: 2 },
    scoringPeriodId: 3,
    settings: { scheduleSettings: { matchupPeriods: { "1": [1] } } },
  };

  it("reports a disconnected ESPN without credentials, reusing any stale snapshot", async () => {
    const bare = { ...env, ESPN_S2: undefined, ESPN_SWID: undefined };
    expect(await league(bare, 2026)).toMatchObject({
      teams: [],
      updated: null,
      stale: false,
      error: "Connect ESPN to load APEX scores.",
    });
    db.sql
      .prepare("INSERT INTO cache(id,data,updated) VALUES(?,?,?)")
      .run(
        "league:2026",
        JSON.stringify({ peopleVersion: 1, teams: [{ id: 1 }], matchups: [], week: 2 }),
        fixed - 600000,
      );
    expect(await league(bare, 2026)).toMatchObject({ week: 2, stale: true, updated: fixed - 600000 });
    expect(calls).toEqual([]);
  });

  it("serves a fresh snapshot without calling ESPN", async () => {
    await putCache(db, "league:2026", { peopleVersion: 1, teams: [{ id: 1 }], matchups: [], week: 3 });
    expect(await league(env, 2026)).toMatchObject({ week: 3, stale: false, updated: fixed });
    expect(calls).toEqual([]);
  });

  it("parses teams, owners, matchups and previous seasons and caches the result", async () => {
    provider = ok(espn);
    const l = await league(env, 2026);
    expect(calls[0]).toContain("/seasons/2026/segments/0/leagues/244513322?");
    expect(l.teams).toEqual([
      expect.objectContaining({
        id: 1,
        ownerKey: "{A}|{B}",
        personName: "sam_two / Alex One",
        name: "Named",
        wins: 2,
        losses: 1,
        ties: 0,
        points: 300,
        rank: 0,
      }),
      expect.objectContaining({ id: 2, ownerKey: "team:2", personName: null, name: "Loc Nick", rank: 4 }),
      expect.objectContaining({ id: 3, name: "Team 3" }),
    ]);
    expect(l).toMatchObject({
      previousSeasons: [2025],
      matchups: [{ id: 10, week: 1, home: { id: 1, score: 100 }, away: { id: 2, score: 90 } }],
      week: 3,
      scoringPeriod: 3,
      latestComplete: 2,
      periods: { "1": [1] },
      stale: false,
    });
    expect((await cached(db, "league:2026"))?.data).toMatchObject({ peopleVersion: 1 });
  });

  it("refreshes a snapshot from an older people version", async () => {
    await putCache(db, "league:2026", { teams: [{ id: 1 }], matchups: [], week: 1 });
    provider = ok(espn);
    expect((await league(env, 2026)).week).toBe(3);
    expect(calls.length).toBe(1);
  });

  it("falls back to the stale snapshot when ESPN fails or returns no teams", async () => {
    expect(await league(env, 2026)).toMatchObject({
      teams: [],
      stale: false,
      updated: null,
      error: "ESPN could not refresh. Any saved scores are marked stale.",
    });
    provider = ok({ teams: [] });
    expect((await league(env, 2026)).error).toMatch(/could not refresh/);
    db.sql
      .prepare("INSERT INTO cache(id,data,updated) VALUES(?,?,?)")
      .run(
        "league:2025",
        JSON.stringify({ peopleVersion: 1, teams: [{ id: 1 }], matchups: [], week: 17 }),
        fixed - 2 * 86400000,
      );
    provider = down;
    expect(await league(env, 2025)).toMatchObject({ week: 17, stale: true, updated: fixed - 2 * 86400000 });
  });
});

describe("games", () => {
  const scoreboard = {
    events: [
      {
        id: "401",
        shortName: "HOU @ IND",
        date: "2026-09-27T17:00Z",
        status: { type: { completed: true, shortDetail: "Final" } },
        competitions: [
          {
            competitors: [
              { homeAway: "home", score: "24", team: { displayName: "Indianapolis Colts" } },
              { homeAway: "away", score: "17", team: { displayName: "Houston Texans" } },
            ],
          },
        ],
      },
      { id: "402", date: "2026-09-27T20:00Z" },
    ],
  };

  it("uses a fresh cache and otherwise normalizes the first host that returns events", async () => {
    await putCache(db, "games:2026:3", [game]);
    expect(await games(db, 2026, 3)).toEqual([game]);
    expect(calls).toEqual([]);
    db.sql.exec("DELETE FROM cache");
    provider = (url) => (url.includes("site.web.api") ? Response.json(scoreboard) : Response.json({ events: [] }));
    const list = await games(db, 2026, 3);
    expect(calls.length).toBe(2);
    expect(list[0]).toEqual({ ...game, scheduleOnly: false });
    expect(list[1]).toMatchObject({
      id: "402",
      name: "",
      home: "",
      away: "",
      completed: false,
      state: "Scheduled",
      homeScore: 0,
      awayScore: 0,
    });
    expect((await cached(db, "games:2026:3"))?.data).toHaveLength(2);
  });

  it("degrades to a schedule-only view from the stale cache, then the bundled backup", async () => {
    db.sql
      .prepare("INSERT INTO cache(id,data,updated) VALUES(?,?,?)")
      .run("games:2026:3", JSON.stringify([game]), fixed - 600000);
    expect(await games(db, 2026, 3)).toEqual([
      { ...game, completed: false, scheduleOnly: true, state: "Schedule only · scores unavailable" },
    ]);
    db.sql.exec("DELETE FROM cache");
    const backup = await games(db, 2026, 2);
    expect(backup.length).toBeGreaterThan(0);
    expect(backup.every((g) => g.scheduleOnly && !g.completed && g.homeScore === 0)).toBe(true);
    expect(backup[0].state).toBe("Schedule only · scores unavailable");
    await expect(games(db, 2026, 9)).rejects.toThrow("NFL schedule is unavailable. Please try again shortly.");
  });
});

describe("eventSummary and bindPick", () => {
  it("caches box scores for five minutes", async () => {
    provider = ok(summary());
    expect((await eventSummary(db, game.id)).header?.id).toBe(game.id);
    expect(await eventSummary(db, game.id)).toBeTruthy();
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain("summary?event=401");
  });

  it("passes custom and team picks through with a rule", async () => {
    const custom = { ...base, market: "custom" };
    expect(await bindPick(env, custom, 2026)).toBe(custom);
    expect((await bindPick(env, base, 2026)).settlement).toMatchObject({ market: "h2h", statKey: "gameScore" });
    expect(calls).toEqual([]);
  });

  it("verifies player props against the game header and both rosters", async () => {
    const prop = { ...base, market: "player_receptions", player: "Josh Downs", side: "Over", line: 4.5 };
    provider = ok(summary({ header: { id: "999" } }));
    await expect(bindPick(env, prop, 2026)).rejects.toThrow("ESPN could not verify this game. Please retry.");
    db.sql.exec("DELETE FROM cache");
    provider = ok(summary({ header: { id: game.id, competitions: [{ competitors: [{ id: "11" }] }] } }));
    await expect(bindPick(env, prop, 2026)).rejects.toThrow("ESPN rosters are unavailable. Please retry.");
    db.sql.exec("DELETE FROM cache");
    await putCache(db, "roster:2026:11", { athletes: [{ items: [{ id: 4688813, displayName: "Josh Downs" }] }] });
    provider = (url) =>
      url.includes("/teams/34/roster")
        ? Response.json({ athletes: [{ items: [{ id: "1", displayName: "Josh Downs Jr." }] }] })
        : Response.json(summary());
    await expect(bindPick(env, prop, 2026)).rejects.toThrow(/Could not uniquely match this player/);
    expect(calls.filter((u) => u.includes("/roster"))).toHaveLength(1);
    await putCache(db, "roster:2026:34", { athletes: [{ items: [{ id: "2", displayName: "Someone Else" }] }] });
    expect((await bindPick(env, prop, 2026)).settlement?.athleteId).toBe("4688813");
  });
});

describe("grade", () => {
  it("keeps picks pending while results are missing, incomplete or unscored", async () => {
    const missing = seed(base);
    const scheduleOnly = seed({ ...base, eventId: "402" });
    const noTeams = seed({ ...base, eventId: "403" });
    const live = seed({ ...base, eventId: "404" });
    const deferred = seed({ ...base, eventId: "404", market: "player_receptions", verificationPending: true });
    await grade(db, 2026, 3, [
      { ...game, id: "402", scheduleOnly: true },
      { ...game, id: "403", home: "" },
      { ...game, id: "404", completed: false, state: "Q3 · 4:12" },
    ]);
    expect(row(missing).actual).toBe("Waiting for ESPN game results; will retry.");
    expect(row(scheduleOnly).actual).toBe("Waiting for ESPN game results; will retry.");
    expect(row(noTeams).actual).toBe("Waiting for ESPN team data; will retry.");
    expect(row(live).actual).toBe("Waiting for a final result · Q3 · 4:12");
    expect(row(deferred).actual).toBe(verificationPending);
    expect(db.sql.prepare("SELECT COUNT(*) AS n FROM picks WHERE result='pending'").get()).toEqual({ n: 5 });
  });

  it("settles team, total and custom legs from the final score and attaches a rule to legacy picks", async () => {
    const legacy = seed(base);
    const away = seed({ ...base, side: game.away });
    const total = seed({ ...base, market: "totals", side: "Under", line: 40.5 });
    const custom = seed({ ...base, market: "custom", side: "Anything" });
    const graded = seed(base, { result: "won", actual: "Commissioner: done" });
    await grade(db, 2026, 3, [game]);
    expect(row(legacy)).toMatchObject({ result: "won", actual: "ESPN: 17–24" });
    expect(JSON.parse(row(legacy).data).settlement).toMatchObject({ provider: "espn", statKey: "gameScore" });
    expect(row(away).result).toBe("lost");
    expect(row(total)).toMatchObject({ result: "lost", actual: "ESPN: 41" });
    expect(row(custom)).toMatchObject({ result: "review", actual: "Manual review required" });
    expect(row(graded)).toMatchObject({ result: "won", actual: "Commissioner: done" });
  });

  it("verifies legacy player props only against a unique athlete in a final box score", async () => {
    const prop = { ...base, market: "player_receptions", player: "Josh Downs", side: "Over", line: 4.5 };
    const id = seed(prop);
    provider = ok(summary({ header: { id: "999" } }));
    await grade(db, 2026, 3, [game]);
    expect(row(id).actual).toBe("Waiting for a verified final ESPN box score; will retry.");
    db.sql.exec("DELETE FROM cache");
    provider = ok(
      summary({
        boxscore: {
          players: [
            {
              statistics: [
                {
                  name: "receiving",
                  keys: ["receptions"],
                  athletes: [
                    { athlete: { id: "1", displayName: "Josh Downs" }, stats: ["7"] },
                    { athlete: { id: "2", displayName: "Josh Downs" }, stats: ["3"] },
                  ],
                },
              ],
            },
          ],
        },
      }),
    );
    await grade(db, 2026, 3, [game]);
    expect(row(id).actual).toMatch(/could not be uniquely verified/);
    db.sql.exec("DELETE FROM cache");
    provider = ok(summary());
    await grade(db, 2026, 3, [game]);
    expect(row(id)).toMatchObject({ result: "won", actual: "ESPN: 7" });
    expect(JSON.parse(row(id).data)).toMatchObject({
      verificationPending: false,
      settlement: { athleteId: "4688813" },
    });
  });

  it("explains missing player stats and provider failures without guessing a result", async () => {
    const prop = { ...base, market: "player_receptions", player: "Josh Downs", side: "Over", line: 4.5 };
    const receptions = seed({ ...prop, settlement: makeRule(prop, "nobody") });
    const td = { ...prop, market: "player_anytime_td", side: "Yes", line: null };
    const touchdown = seed({ ...td, settlement: makeRule(td, "nobody") });
    provider = ok(summary());
    await grade(db, 2026, 3, [game]);
    expect(row(receptions).actual).toMatch(/no verified final stat for this player/);
    expect(row(touchdown).actual).toMatch(/Touchdown result or participation is unconfirmed/);

    db.sql.exec("DELETE FROM cache");
    provider = down;
    await grade(db, 2026, 3, [game]);
    expect(row(receptions).actual).toBe("Data provider unavailable (503). Player result will retry.");

    // A malformed cached box score is an unexpected error, not a provider outage.
    const legacy = seed(prop);
    await putCache(db, "box:" + game.id, { header: summary().header, boxscore: { players: {} } });
    await grade(db, 2026, 3, [game]);
    expect(row(legacy).actual).toBe("ESPN could not refresh this result. Will retry.");
    expect(row(legacy).result).toBe("pending");
  });
});

describe("funder", () => {
  const l = (over: Partial<LeagueState>): LeagueState => ({
    teams: [
      { id: 1, name: "Team One", personName: "Alex" },
      { id: 2, name: "Team Two", personName: null },
    ] as LeagueState["teams"],
    matchups: [{ id: 1, week: 2, home: { id: 1, score: 80 }, away: { id: 2, score: 90 } }],
    week: 3,
    scoringPeriod: 3,
    periods: { "2": [2] },
    updated: null,
    stale: false,
    ...over,
  });

  it("names the previous week's low scorer once that week has closed", () => {
    expect(funder(l({}), 3)).toEqual({ ids: [1], score: 80, tie: false, names: "Alex" });
    expect(
      funder(l({ matchups: [{ id: 1, week: 2, home: { id: 1, score: 90 }, away: { id: 2, score: 80 } }] }), 3),
    ).toMatchObject({ ids: [2], names: "Team Two" });
    expect(
      funder(l({ matchups: [{ id: 1, week: 2, home: { id: 1, score: 80 }, away: { id: 2, score: 80 } }] }), 3),
    ).toMatchObject({ ids: [1, 2], tie: true, names: "Alex / Team Two" });
  });

  it("returns nothing for week one, future weeks, open weeks or incomplete scores", () => {
    expect(funder(l({}), 1)).toBeNull();
    expect(funder(l({ week: null }), 3)).toBeNull();
    expect(funder(l({}), 4)).toBeNull();
    expect(funder(l({ periods: {} }), 3)).toBeNull();
    expect(funder(l({ scoringPeriod: undefined }), 3)).toBeNull();
    expect(funder(l({ scoringPeriod: 2 }), 3)).toBeNull();
    expect(funder(l({ matchups: [{ id: 1, week: 2, home: { id: 1, score: 80 }, away: null }] }), 3)).toBeNull();
  });
});
