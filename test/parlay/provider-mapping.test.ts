import { describe, expect, it } from "vitest";
import teams from "#shared/parlay/nfl-teams.json" with { type: "json" };
import { oddsEventForGame, sameTeam, teamId, uniquePlayerId } from "#shared/parlay/provider-mapping";

describe("NFL team identities", () => {
  it("maps all 32 names and abbreviations", () => {
    expect(teams.length).toBe(32);
    expect(new Set(teams.map((t) => t.id)).size).toBe(32);
    for (const t of teams) {
      expect(teamId(t.name)).toBe(t.id);
      expect(sameTeam(t.name, t.abbreviation)).toBe(true);
    }
  });
});

describe("oddsEventForGame", () => {
  const game = { home: "Indianapolis Colts", away: "Houston Texans", date: "2026-09-27T17:00:00Z" };
  const event = { id: "odds-id", home_team: "IND", away_team: "HOU", commence_time: game.date };
  it("requires exactly one same-day match with the right home/away", () => {
    expect(oddsEventForGame([event], game).id).toBe(event.id);
    expect(() => oddsEventForGame([event, event], game)).toThrow(/Multiple/);
    expect(() => oddsEventForGame([{ ...event, home_team: "HOU", away_team: "IND" }], game)).toThrow(/No matching/);
    expect(() => oddsEventForGame([{ ...event, commence_time: "2026-10-04T17:00:00Z" }], game)).toThrow(/No matching/);
  });
});

describe("uniquePlayerId", () => {
  it("ignores formatting, accents and suffixes but never guesses", () => {
    expect(uniquePlayerId("Test-Player Jr.", [{ id: "1", displayName: "Test Player" }])).toBe("1");
    expect(uniquePlayerId("Andre Player", [{ id: "1", displayName: "André Player" }])).toBe("1");
    expect(
      uniquePlayerId("Test Player", [
        { id: "1", displayName: "Test Player Jr." },
        { id: "2", displayName: "Test Player Sr." },
      ]),
    ).toBeUndefined();
    expect(
      uniquePlayerId("Test Player", [
        { id: "1", displayName: "Test Player" },
        { id: "1", displayName: "Test Player" },
      ]),
    ).toBe("1");
    expect(uniquePlayerId("Test Player", [{ id: "2", displayName: "Other Player" }])).toBeUndefined();
  });
});
