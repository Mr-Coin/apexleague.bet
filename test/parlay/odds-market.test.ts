import { describe, expect, it } from "vitest";
import { marketOptions, type OddsBookmaker, type OddsOutcome, oddsCacheTtl } from "../../worker/parlay/odds-market";

const book = (key: string, market: string, outcomes: OddsOutcome[]): OddsBookmaker => ({
  key,
  title: key,
  markets: [{ key: market, last_update: "2026-09-22T12:00:00Z", outcomes }],
});

describe("marketOptions", () => {
  it("prefers DraftKings for every numeric prop market", () => {
    for (const market of [
      "player_pass_yds",
      "player_pass_tds",
      "player_rush_yds",
      "player_reception_yds",
      "player_receptions",
    ]) {
      const r = marketOptions(
        {
          bookmakers: [
            book("fanduel", market, [{ name: "Over", description: "Test Player", point: 50.5, price: -110 }]),
            book("draftkings", market, [{ name: "Under", description: "Test Player", point: 40.5, price: 120 }]),
          ],
        },
        market,
      );
      expect(r.book).toBe("draftkings");
      expect(r.options[0]).toMatchObject({ player: "Test Player", line: 40.5, odds: 120 });
    }
  });

  it("handles anytime TD, bookmaker fallback and empty markets", () => {
    const td = marketOptions(
      {
        bookmakers: [
          book("draftkings", "player_anytime_td", [{ name: "Yes", description: "Test Player", price: 150 }]),
        ],
      },
      "player_anytime_td",
    );
    expect(td.options[0].line).toBeNull();
    expect(td.options[0].side).toBe("Yes");

    const fallback = marketOptions(
      {
        bookmakers: [
          book("draftkings", "player_receptions", []),
          book("fanduel", "player_receptions", [{ name: "Over", description: "Test Player", point: 5.5, price: -110 }]),
        ],
      },
      "player_receptions",
    );
    expect(fallback.book).toBe("fanduel");
    expect(oddsCacheTtl(fallback)).toBe(43200000);

    const empty = marketOptions({ bookmakers: [] }, "player_receptions");
    expect(oddsCacheTtl(empty)).toBe(300000);
    expect(empty.message).toBeTruthy();
  });
});
