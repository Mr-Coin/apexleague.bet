import { describe, expect, it } from "vitest";
import { currentLow, regularSeasonLows } from "../../worker/parlay/history";
import type { LeagueState } from "../../worker/parlay/types";
const league: LeagueState = {
  teams: [1, 2].map((id) => ({
    id,
    ownerKey: String(id),
    personName: `Person ${id}`,
    name: `Team ${id}`,
    wins: 0,
    losses: 0,
    ties: 0,
    points: 0,
    rank: 0,
  })),
  matchups: [1, 2, 3].map((week) => ({
    id: week,
    week,
    home: { id: 1, score: week === 3 ? 1 : 50 },
    away: { id: 2, score: 50 },
  })),
  regularSeasonWeeks: 2,
  week: 3,
  scoringPeriod: 3,
  periods: { 1: [1], 2: [2], 3: [3] },
  updated: 1,
  stale: false,
};
describe("regular-season weekly low distribution", () => {
  it("excludes playoffs, counts ties once, and retains names", () => {
    const lows = regularSeasonLows({ ...league, scoringPeriod: 4 }, 2025);
    expect(lows).toHaveLength(2);
    expect(lows[0].people.map((p) => p.name)).toEqual(["Person 1", "Person 2"]);
  });
  it("does not guess a missing cutoff", () =>
    expect(regularSeasonLows({ ...league, regularSeasonWeeks: undefined }, 2025)).toEqual([]));
  it("excludes incomplete weeks and missing team scores", () => {
    expect(regularSeasonLows({ ...league, scoringPeriod: 2 }, 2026)).toHaveLength(1);
    expect(regularSeasonLows({ ...league, matchups: [{ ...league.matchups[0], away: null }] }, 2026)).toEqual([]);
  });
  it("keeps live data separate and rejects playoff, stale and pregame comparisons", () => {
    expect(currentLow(league, 2026)).toBeNull();
    const live = { ...league, week: 2, scoringPeriod: 2 };
    expect(currentLow(live, 2026)?.score).toBe(50);
    expect(currentLow({ ...live, stale: true }, 2026)).toBeNull();
    expect(
      currentLow(
        {
          ...live,
          matchups: live.matchups.map((m) => ({ ...m, home: { id: 1, score: 0 }, away: { id: 2, score: 0 } })),
        },
        2026,
      ),
    ).toBeNull();
  });
});
