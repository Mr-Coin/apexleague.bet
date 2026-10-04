// Small pure helpers: labels, odds parsing, team/player matching, week math and the box-score reader.
import { describe, expect, it } from "vitest";
import { compare, type Game, type Pick, pickLabel, price, settle } from "#shared/parlay/model";
import { oddsEventForGame, sameTeam, teamId, uniquePlayerId } from "#shared/parlay/provider-mapping";
import { activeWeek, isThursday, pickDeadline, picksClosed } from "#shared/parlay/week";
import { bettingRecords } from "../../worker/parlay/betting-performance";
import { marketOptions, oddsCacheTtl } from "../../worker/parlay/odds-market";
import { makeRule, readPlayerStat } from "../../worker/parlay/settlement";
import type { EspnSummary } from "../../worker/parlay/types";
import { backfillWeek2, week2Entries } from "../../worker/parlay/week2-backfill";

const pick = (over: Partial<Pick>): Pick => ({
  eventId: "e",
  game: "A @ B",
  kickoff: "2026-09-27T17:00Z",
  market: "h2h",
  player: "",
  side: "Home Team",
  line: null,
  odds: -110,
  book: "Book",
  source: "manual",
  sourceTime: 0,
  ...over,
});
const game: Game = {
  id: "e",
  name: "A @ B",
  home: "Home Team",
  away: "Away Team",
  date: "2026-09-27T17:00Z",
  completed: true,
  state: "Final",
  homeScore: 20,
  awayScore: 24,
};

describe("model helpers", () => {
  it("labels picks, keeping the approved Josh Downs ticket wording", () => {
    expect(pickLabel(pick({ market: "player_receptions", player: "Josh Downs", side: "Over", line: 4.5 }))).toBe(
      "Josh Downs · Over · 4.5 · Receptions",
    );
    expect(pickLabel(pick({ note: "Ticket: Josh Downs 4+ receptions" }))).toBe("Josh Downs · 4+ receptions");
    expect(pickLabel(pick({ market: "mystery", side: "X" }))).toBe("X · mystery");
    expect(price(150)).toBe("+150");
    expect(price(-110)).toBe("-110");
    expect(compare(5, 5, "Over")).toBe("push");
    expect(compare(4, 5, "Under")).toBe("won");
  });

  it("settles every market shape and sends unknowns to review", () => {
    expect(settle(pick({}), { ...game, completed: false })).toBeNull();
    expect(settle(pick({ side: "Away Team" }), game)).toEqual({ result: "won", actual: "24–20" });
    expect(settle(pick({ side: "Nobody" }), game)).toEqual({ result: "review", actual: "Team mismatch" });
    expect(settle(pick({ market: "spreads", line: 4 }), game)).toEqual({ result: "push", actual: "24–20" });
    expect(settle(pick({ market: "totals", side: "Over", line: 43.5 }), game)).toEqual({ result: "won", actual: "44" });
    expect(settle(pick({ market: "player_rush_yds", side: "Over", line: 50 }), game)).toEqual({
      result: "review",
      actual: "Verify participation / settlement",
    });
    expect(settle(pick({ market: "player_anytime_td", side: "Yes" }), game, 0)).toEqual({
      result: "lost",
      actual: "0",
    });
    expect(settle(pick({ market: "custom" }), game)).toEqual({ result: "review", actual: "Manual review required" });
  });
});

describe("provider mapping", () => {
  it("matches teams by name or abbreviation and falls back to a normalized comparison", () => {
    expect(teamId("Indianapolis Colts")).toBe(teamId("IND"));
    expect(teamId("Nowhere FC")).toBeUndefined();
    expect(sameTeam("ind", "Indianapolis Colts")).toBe(true);
    expect(sameTeam("Nowhere FC", "nowhere f.c.")).toBe(true);
    expect(sameTeam("Nowhere FC", "Indianapolis Colts")).toBe(false);
  });

  it("requires exactly one odds event within a day of kickoff", () => {
    const g = { home: "Indianapolis Colts", away: "Houston Texans", date: "2026-09-27T17:00Z" };
    const e = { id: "1", home_team: "IND", away_team: "HOU", commence_time: "2026-09-27T17:05Z" };
    expect(oddsEventForGame([e], g).id).toBe("1");
    expect(() => oddsEventForGame([e, { ...e, id: "2" }], g)).toThrow(/Multiple odds events/);
    expect(() => oddsEventForGame([{ ...e, commence_time: "2026-10-04T17:00Z" }], g)).toThrow(/No matching odds event/);
  });

  it("identifies a player only when every name match shares one id", () => {
    const players = [
      { id: "1", displayName: "Josh Downs" },
      { id: "1", displayName: "Josh Downs Jr." },
      { id: "2", displayName: "Other Player" },
    ];
    expect(uniquePlayerId("josh downs", players)).toBe("1");
    expect(uniquePlayerId("Josh Downs", [...players, { id: "3", displayName: "Josh Downs" }])).toBeUndefined();
    expect(uniquePlayerId("Nobody", players)).toBeUndefined();
    expect(uniquePlayerId("Other Player", [{ displayName: "Other Player" }])).toBeUndefined();
  });
});

describe("week math", () => {
  it("clamps the active week to the regular season and flags Thursday kickoffs", () => {
    expect(activeWeek(2026, new Date("2026-07-01T00:00:00Z"))).toBe(1);
    expect(activeWeek(2026, new Date("2027-02-01T00:00:00Z"))).toBe(18);
    expect(isThursday("2026-09-24T23:15:00Z")).toBe(true);
    expect(isThursday("2026-09-25T02:00:00Z")).toBe(true); // still Thursday evening in New York
    expect(isThursday("2026-09-27T17:00:00Z")).toBe(false);
    expect(picksClosed(2026, 3, pickDeadline(2026, 3) - 1)).toBe(false);
    expect(picksClosed(2026, 3, pickDeadline(2026, 3))).toBe(true);
  });
});

describe("odds market parsing", () => {
  it("prefers DraftKings, tolerates missing points and times, and explains an empty market", () => {
    const data = {
      bookmakers: [
        { key: "fanduel", title: "FanDuel", markets: [{ key: "h2h", outcomes: [{ name: "A", price: 100 }] }] },
        {
          key: "draftkings",
          title: "DraftKings",
          last_update: "2026-09-24T12:00:00Z",
          markets: [{ key: "h2h", outcomes: [{ name: "A", price: -105, point: null }] }],
        },
      ],
    };
    const dk = marketOptions(data, "h2h");
    expect(dk.book).toBe("DraftKings");
    expect(dk.options[0]).toMatchObject({
      side: "A",
      odds: -105,
      line: null,
      sourceTime: Date.parse("2026-09-24T12:00:00Z"),
    });
    const fd = marketOptions({ bookmakers: data.bookmakers.slice(0, 1) }, "h2h");
    expect(fd.options[0].book).toBe("FanDuel");
    expect(fd.options[0].sourceTime).toBeGreaterThan(0);
    const none = marketOptions(data, "totals");
    expect(none).toEqual({ options: [], book: null, message: expect.stringMatching(/No sportsbook has posted/) });
    expect(oddsCacheTtl(none)).toBe(5 * 60000);
    expect(oddsCacheTtl(dk)).toBe(12 * 3600000);
    expect(marketOptions({}, "h2h").options).toEqual([]);
  });
});

describe("box score reader", () => {
  it("ignores unrelated stat groups and plays it cannot classify", () => {
    const td = pick({ market: "player_anytime_td", side: "Yes" });
    const rule = makeRule(td, "7");
    const data: EspnSummary = {
      header: {
        id: "e",
        competitions: [
          {
            status: { type: { completed: true } },
            competitors: [
              { id: "a", homeAway: "home", score: "7" },
              { id: "b", homeAway: "away", score: "0" },
            ],
          },
        ],
      },
      scoringPlays: [
        { type: { id: "67" }, scoringType: { name: "mystery" }, team: { id: "a" }, homeScore: 7, awayScore: 0 },
      ],
      boxscore: {
        players: [
          {
            team: { id: "a" },
            statistics: [
              { name: "passing", keys: ["passingTouchdowns"], athletes: [{ athlete: { id: "7" }, stats: ["1"] }] },
              {
                name: "rushing",
                keys: ["rushingAttempts", "rushingTouchdowns"],
                athletes: [{ athlete: { id: "7" }, stats: ["3", "0"] }],
              },
            ],
          },
          { team: { id: "b" }, statistics: [] },
        ],
      },
    };
    // Passing TDs never count toward an anytime TD, and an unknown scoring type cannot prove a zero.
    expect(readPlayerStat(data, { ...td, settlement: rule })).toBeUndefined();
    expect(rule.statKey).toBe("scoringTouchdowns");
    expect(makeRule(pick({ market: "custom" })).statKey).toBe("gameScore");
  });
});

describe("betting records", () => {
  it("counts a corrupt pick row as unpriced rather than crashing", () => {
    const [r] = bettingRecords([{ season: 2026, week: 1, team_id: 1, result: "won", data: "{nope" }], new Map());
    expect(r).toMatchObject({ key: "2026:1", wins: 1, missingOdds: 1, priced: 0 });
  });
});

describe("week 2 backfill guards", () => {
  it("refuses schedule-only games", async () => {
    const games = week2Entries.map((e) => ({
      id: e.event,
      name: "Game",
      date: "2026-09-20T17:00Z",
      completed: false,
      scheduleOnly: true,
    }));
    const league = { teams: week2Entries.map((e) => ({ id: e.team, personName: e.name })) };
    const db = {
      prepare: () => ({ bind: () => ({ first: async () => null }) }),
      batch: async () => {
        throw new Error("must not write");
      },
    };
    await expect(backfillWeek2(db, league, games)).rejects.toThrow(
      "Week 2 backfill requires verified member and game data.",
    );
  });
});

describe("touchdown zero verification edge cases", () => {
  const td = pick({ eventId: "e", market: "player_anytime_td", side: "Yes" });
  const tdPick: Pick = { ...td, settlement: makeRule(td, "p") };
  const group = (name: string, keys: string[], athletes: { athlete: { id: string }; stats: string[] }[]) => ({
    name,
    keys,
    athletes,
  });
  const row = (id: string, stats: string[]) => ({ athlete: { id }, stats });
  const box = (): EspnSummary => ({
    header: {
      id: "e",
      competitions: [
        {
          status: { type: { completed: true } },
          competitors: [
            { id: "a", homeAway: "home", score: "7" },
            { id: "b", homeAway: "away", score: "3" },
          ],
        },
      ],
    },
    scoringPlays: [
      { type: { id: "68" }, scoringType: { name: "touchdown" }, team: { id: "a" }, homeScore: 7, awayScore: 0 },
      { type: { id: "59" }, scoringType: { name: "field-goal" }, team: { id: "b" }, homeScore: 7, awayScore: 3 },
    ],
    boxscore: {
      players: [
        {
          team: { id: "a" },
          statistics: [
            group("rushing", ["rushingAttempts", "rushingTouchdowns"], [row("p", ["4", "0"]), row("s", ["1", "1"])]),
            group("receiving", ["receptions", "receivingTouchdowns"], [row("p", ["0", "0"])]),
          ],
        },
        {
          team: { id: "b" },
          statistics: [
            group("rushing", ["rushingAttempts", "rushingTouchdowns"], []),
            group("receiving", ["receptions", "receivingTouchdowns"], [row("x", ["2", "0"])]),
          ],
        },
      ],
    },
  });

  it("proves a zero for a participating non-scorer with a reconciled log", () => {
    expect(readPlayerStat(box(), tdPick)).toBe(0);
  });

  it("stays unproven whenever the feed cannot be reconciled", () => {
    const cases: ((d: EspnSummary) => void)[] = [
      (d) => d.header!.competitions![0].competitors!.pop(),
      (d) => d.boxscore!.players!.pop(),
      (d) => (d.header!.competitions![0].competitors![0].homeAway = undefined),
      (d) => (d.header!.competitions![0].competitors![0].score = "-1"),
      (d) => (d.scoringPlays![1].team = { id: "zzz" }),
      (d) => (d.scoringPlays![1].homeScore = 10), // other side's score moved on a field goal
      (d) => (d.scoringPlays![1].awayScore = 2), // wrong delta for a field goal
      (d) => (d.scoringPlays![0].type = { id: "99" }),
      (d) => (d.boxscore!.players![1].team = { id: "a" }),
      (d) => (d.boxscore!.players![1].statistics![0].name = "passing"),
      (d) => (d.boxscore!.players![0].statistics![0].keys = ["rushingAttempts"]),
      (d) => (d.boxscore!.players![0].statistics![0].athletes = undefined),
      (d) => d.boxscore!.players![0].statistics![0].athletes!.push(row("p", ["1", "0"])),
      (d) => (d.boxscore!.players![0].statistics![0].athletes![1].stats = ["1", "1.5"]),
      (d) => (d.boxscore!.players![0].statistics![0].athletes![0].athlete = { id: "" }),
      (d) => (d.boxscore!.players![0].statistics![0].athletes![0].stats = ["0", "0"]), // never participated
    ];
    cases.forEach((mutate, i) => {
      const d = box();
      mutate(d);
      expect(readPlayerStat(d, tdPick), "case " + i).toBeUndefined();
    });
    // Scoring plays with no team at all cannot be attributed.
    const d = box();
    d.scoringPlays![0].team = undefined;
    expect(readPlayerStat(d, tdPick)).toBeUndefined();
  });
});
