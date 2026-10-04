// All-time low finishes and the betting performance aggregation across seasons.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { putCache } from "../../worker/parlay/cache";
import { allTime, bettingPerformance, lowFinishes } from "../../worker/parlay/history";
import type { LeagueState } from "../../worker/parlay/types";
import { fakeD1 } from "./fake-d1";
import { testEnv } from "./helpers";

const fixed = Date.parse("2026-09-24T14:00:00Z");
const db = fakeD1(() => fixed);
const env = testEnv(db);

const state = (over: Partial<LeagueState>): LeagueState => ({
  teams: [
    { id: 1, ownerKey: "a", personName: "Alex", name: "Team One" },
    { id: 2, ownerKey: "b", personName: null, name: "Team Two" },
  ] as LeagueState["teams"],
  matchups: [
    { id: 1, week: 1, home: { id: 1, score: 80 }, away: { id: 2, score: 90 } },
    { id: 2, week: 2, home: { id: 1, score: 95 }, away: { id: 2, score: 70 } },
    { id: 3, week: 3, home: { id: 1, score: 50 }, away: { id: 2, score: 60 } },
  ],
  week: 3,
  scoringPeriod: 3,
  periods: { "1": [1], "2": [2], "3": [3] },
  updated: null,
  stale: false,
  ...over,
});

beforeAll(() => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", async () => new Response("down", { status: 503 }));
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  db.close();
});
beforeEach(() => db.sql.exec("DELETE FROM cache; DELETE FROM picks;"));

describe("lowFinishes", () => {
  it("records each closed single-period week's low scorer", () => {
    expect(lowFinishes(state({}), 2026)).toEqual([
      { season: 2026, week: 1, score: 80, tie: false, people: [{ key: "a", name: "Alex" }] },
      { season: 2026, week: 2, score: 70, tie: false, people: [{ key: "b", name: "Team Two" }] },
    ]);
  });

  it("skips multi-period weeks, open weeks, incomplete scores and all-zero weeks", () => {
    expect(lowFinishes(state({ periods: { "1": [1, 2], "2": [2] } }), 2026).map((r) => r.week)).toEqual([2]);
    expect(lowFinishes(state({ scoringPeriod: undefined }), 2026)).toEqual([]);
    expect(lowFinishes(state({ teams: [] }), 2026)).toEqual([]);
    expect(
      lowFinishes(
        state({
          matchups: [
            { id: 1, week: 1, home: { id: 1, score: 0 }, away: { id: 2, score: 0 } },
            { id: 2, week: 2, home: { id: 1, score: 10 }, away: null },
          ],
        }),
        2026,
      ),
    ).toEqual([]);
  });

  it("marks ties and falls back to generated keys for unknown teams", () => {
    const r = lowFinishes(
      state({
        teams: [{ id: 1, ownerKey: "a", personName: "Alex", name: "Team One" }] as LeagueState["teams"],
        matchups: [{ id: 1, week: 1, home: { id: 1, score: 80 }, away: { id: 9, score: 80 } }],
      }),
      2026,
    );
    expect(r).toEqual([]); // two scores for a one-team league never reconcile
    const tie = lowFinishes(
      state({ matchups: [{ id: 1, week: 1, home: { id: 1, score: 80 }, away: { id: 2, score: 80 } }] }),
      2026,
    );
    expect(tie[0]).toMatchObject({ tie: true, people: [{ key: "a" }, { key: "b" }] });
    const unknown = lowFinishes(
      state({
        teams: [{ id: 1 }, { id: 9 }] as LeagueState["teams"],
        matchups: [{ id: 1, week: 1, home: { id: 1, score: 80 }, away: { id: 9, score: 70 } }],
      }),
      2025,
    );
    expect(unknown[0].people).toEqual([{ key: "2025:9", name: "Team 9" }]);
  });
});

describe("allTime", () => {
  it("merges the current league with cached previous seasons and lists unavailable ones", async () => {
    await putCache(db, "league:2025", {
      peopleVersion: 1,
      teams: [
        { id: 5, ownerKey: "a", personName: "Alex (2025)", name: "Old" },
        { id: 6, ownerKey: "c", name: "C" },
      ],
      matchups: [{ id: 1, week: 1, home: { id: 5, score: 60 }, away: { id: 6, score: 61 } }],
      week: 17,
      scoringPeriod: 18,
      periods: { "1": [1] },
    });
    const r = await allTime(env, state({ previousSeasons: [2025, 2024] }));
    expect(r.seasons).toEqual([2026, 2025]);
    expect(r.unavailable).toEqual([2024]);
    expect(r.weeks).toBe(3);
    expect(r.leaders).toEqual([
      { name: "Alex", lowWeeks: 2, ties: 0, lowest: 60 },
      { name: "Team Two", lowWeeks: 1, ties: 0, lowest: 70 },
    ]);
  });

  it("counts ties and orders by low weeks then lowest score", async () => {
    const r = await allTime(
      env,
      state({ matchups: [{ id: 1, week: 1, home: { id: 1, score: 80 }, away: { id: 2, score: 80 } }] }),
    );
    expect(r.leaders.map((l) => [l.name, l.ties])).toEqual([
      ["Alex", 1],
      ["Team Two", 1],
    ]);
  });
});

describe("bettingPerformance", () => {
  const insert = (season: number, week: number, team: number, result: string, data: string) =>
    db.sql
      .prepare("INSERT INTO picks(id,season,week,team_id,user_id,data,result,updated) VALUES(?,?,?,?,?,?,?,?)")
      .run(crypto.randomUUID(), season, week, team, "u", data, result, fixed);

  it("aggregates every stored pick, tolerating corrupt rows and missing seasons", async () => {
    insert(2026, 3, 1, "won", JSON.stringify({ odds: -110, market: "h2h" }));
    insert(
      2026,
      2,
      7,
      "won",
      JSON.stringify({
        odds: null,
        eventId: "401872945",
        note: "Historical ticket backfill; Ticket: Josh Downs 4+ receptions",
      }),
    );
    insert(2025, 9, 1, "lost", "{not json");
    const r = await bettingPerformance(env, state({}));
    expect(r.picks).toBe(3);
    expect(r.seasons).toEqual([2025, 2026]);
    expect(r.unavailable).toEqual([2025]);
    const alex = r.leaders.find((l) => l.name === "Alex");
    expect(alex).toMatchObject({ wins: 1, losses: 0 });
    // Week 2 historical estimates only count in the estimated leaderboard.
    const estimated = r.estimatedLeaders.find((l) => l.key === "2026:7");
    expect(estimated?.estimated).toBe(1);
    expect(r.leaders.find((l) => l.key === "2026:7")?.estimated).toBe(0);
  });

  it("returns empty leaderboards with no picks", async () => {
    expect(await bettingPerformance(env, state({}))).toEqual({
      leaders: [],
      estimatedLeaders: [],
      seasons: [],
      picks: 0,
      unavailable: [],
    });
  });
});
