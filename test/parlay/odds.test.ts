// The Odds API adapter: cache TTLs, the monthly credit cap and game/side mapping.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "#shared/parlay/model";
import { cached } from "../../worker/parlay/cache";
import type { MarketOptions } from "../../worker/parlay/odds-market";
import { oddsFor } from "../../worker/parlay/odds";
import { fakeD1 } from "./fake-d1";
import { testEnv } from "./helpers";

const fixed = Date.parse("2026-09-24T14:00:00Z");
const month = "2026-09";
const db = fakeD1(() => fixed);
const env = { ...testEnv(db), ODDS_API_KEY: "key-123" };
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
const event = { id: "ev1", home_team: "Indianapolis Colts", away_team: "Houston Texans", commence_time: game.date };
const h2h = {
  id: "ev1",
  home_team: "Indianapolis Colts",
  away_team: "Houston Texans",
  bookmakers: [
    {
      key: "draftkings",
      title: "DraftKings",
      markets: [
        {
          key: "h2h",
          last_update: "2026-09-24T12:00:00Z",
          outcomes: [
            { name: "IND", price: -150 },
            { name: "HOU", price: 130 },
            { name: "Draw", price: 2000 },
          ],
        },
      ],
    },
  ],
};

const calls: string[] = [];
let provider: (url: string) => Response = () => new Response("down", { status: 503 });
const credits = () =>
  (db.sql.prepare("SELECT credits FROM usage WHERE id=?").get(month) as { credits: number })?.credits;
const stale = (key: string, data: unknown, age: number) =>
  db.sql.prepare("INSERT INTO cache(id,data,updated) VALUES(?,?,?)").run(key, JSON.stringify(data), fixed - age);

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
  calls.length = 0;
  db.sql.exec("DELETE FROM cache; DELETE FROM usage;");
  provider = (url) => Response.json(url.includes("/events?") ? [event] : h2h);
});

describe("oddsFor", () => {
  it("only serves supported, non-custom markets", async () => {
    await expect(oddsFor(env, game, "custom")).rejects.toThrow("Choose a supported market.");
    await expect(oddsFor(env, game, "nope")).rejects.toThrow("Choose a supported market.");
  });

  it("fetches events and odds, maps feed sides onto ESPN names and spends one credit", async () => {
    const r = await oddsFor(env, game, "h2h");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("/events?apiKey=key-123");
    expect(calls[1]).toContain("/events/ev1/odds?apiKey=key-123&regions=us&markets=h2h&oddsFormat=american");
    expect(r).toMatchObject({ book: "DraftKings", cached: false, updated: fixed, message: null });
    expect(r.options.map((o) => [o.side, o.odds])).toEqual([
      ["Indianapolis Colts", -150],
      ["Houston Texans", 130],
      ["Draw", 2000],
    ]);
    expect(credits()).toBe(1);
    expect((await cached(db, "odds-events"))?.data).toEqual([event]);
    expect((await cached<MarketOptions>(db, "odds:v2:g1:h2h"))?.data.options).toHaveLength(3);
  });

  it("serves a fresh cache without a credit and reuses a recent events list", async () => {
    await oddsFor(env, game, "h2h");
    const again = await oddsFor(env, game, "h2h");
    expect(again).toMatchObject({ cached: true, updated: fixed });
    expect(calls).toHaveLength(2);
    expect(credits()).toBe(1);
    // An empty market is only cached for five minutes; the events list for an hour.
    stale("odds:v2:g1:totals", { options: [], book: null, message: "none" }, 6 * 60000);
    provider = () => Response.json({ ...h2h, bookmakers: [] });
    const refreshed = await oddsFor(env, game, "totals");
    expect(refreshed.options).toEqual([]);
    expect(calls).toHaveLength(3);
    expect(calls[2]).toContain("markets=totals");
    expect(credits()).toBe(2);
  });

  it("without an API key, returns the stale cache or asks for manual entry", async () => {
    const keyless = { ...env, ODDS_API_KEY: undefined };
    await expect(oddsFor(keyless, game, "h2h")).rejects.toThrow(
      "Odds feed needs a free API key. Manual picks are available.",
    );
    stale("odds:v2:g1:h2h", { options: [], book: null, message: "old" }, 3600000);
    expect(await oddsFor(keyless, game, "h2h")).toMatchObject({
      message: "old",
      stale: true,
      updated: fixed - 3600000,
    });
    expect(calls).toEqual([]);
  });

  it("stops at the monthly credit cap, preferring a stale cache over an error", async () => {
    db.sql.prepare("INSERT INTO usage(id,credits) VALUES(?,450)").run(month);
    await expect(oddsFor(env, game, "h2h")).rejects.toThrow(
      "Monthly odds allowance reached. Please enter this pick manually.",
    );
    stale("odds:v2:g1:h2h", { options: [], book: null, message: "old" }, 3600000);
    expect(await oddsFor(env, game, "h2h")).toMatchObject({ stale: true });
    expect(credits()).toBe(450);
    expect(calls).toEqual([]);
  });

  it("refuses odds for a different game than requested", async () => {
    provider = (url) => Response.json(url.includes("/events?") ? [event] : { ...h2h, id: "other" });
    await expect(oddsFor(env, game, "h2h")).rejects.toThrow("The odds feed returned a different game. Please retry.");
    provider = (url) => Response.json(url.includes("/events?") ? [event] : { ...h2h, home_team: "Dallas Cowboys" });
    await expect(oddsFor(env, game, "h2h")).rejects.toThrow("The odds feed returned a different game. Please retry.");
    provider = (url) => Response.json(url.includes("/events?") ? [] : h2h);
    db.sql.exec("DELETE FROM cache");
    await expect(oddsFor(env, game, "h2h")).rejects.toThrow(
      "No matching odds event yet. Use manual entry or try later.",
    );
  });

  it("leaves player prop sides untouched", async () => {
    provider = (url) =>
      Response.json(
        url.includes("/events?")
          ? [event]
          : {
              ...h2h,
              bookmakers: [
                {
                  key: "fanduel",
                  title: "FanDuel",
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
    const r = await oddsFor(env, game, "player_receptions");
    expect(r.options).toEqual([
      expect.objectContaining({ player: "Josh Downs", side: "Over", line: 4.5, odds: -120, book: "FanDuel" }),
    ]);
  });
});
