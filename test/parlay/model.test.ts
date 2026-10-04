import { describe, expect, it } from "vitest";
import { decimal, type Game, parlayResult, type Pick, settle } from "#shared/parlay/model";

const game = { id: "1", home: "Home", away: "Away", homeScore: 24, awayScore: 17, completed: true } as Game;
const pick = { market: "spreads", side: "Home", line: -7 } as Pick;

describe("parlayResult", () => {
  it("combines leg results", () => {
    expect(parlayResult([])).toBe("No picks");
    expect(parlayResult([{ result: "lost" }, { result: "pending" }])).toBe("Lost");
    expect(parlayResult([{ result: "won" }, { result: "review" }])).toBe("Pending");
    expect(parlayResult([{ result: "won" }, { result: "push" }])).toBe("Won");
    expect(parlayResult([{ result: "void" }, { result: "push" }])).toBe("Push / void");
  });
});

describe("settle", () => {
  it("grades spreads, totals, props and TDs", () => {
    expect(settle(pick, game)?.result).toBe("push");
    expect(settle({ ...pick, line: -6.5 }, game)?.result).toBe("won");
    expect(settle({ ...pick, side: "Away", line: 6.5 }, game)?.result).toBe("lost");
    expect(settle({ ...pick, market: "totals", side: "Under", line: 42 }, game)?.result).toBe("won");
    expect(settle({ ...pick, market: "player_receptions", side: "Over", line: 4.5 }, game, 5)?.result).toBe("won");
    expect(settle({ ...pick, market: "player_receptions" }, game)?.result).toBe("review");
    expect(settle({ ...pick, market: "player_anytime_td" }, game, 1)?.result).toBe("won");
    expect(settle(pick, { ...game, completed: false })).toBeNull();
  });
});

describe("decimal", () => {
  it("converts American odds", () => {
    expect(decimal(150)).toBe(2.5);
    expect(decimal(-200)).toBe(1.5);
  });
});
