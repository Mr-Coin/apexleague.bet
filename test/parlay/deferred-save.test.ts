// Real routes and SQL against an in-memory D1, isolated from external providers.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "#shared/parlay/model";
import { putCache } from "../../worker/parlay/cache";
import { grade } from "../../worker/parlay/espn";
import type { EspnSummary, PickRow } from "../../worker/parlay/types";
import { fakeD1 } from "./fake-d1";
import { client, json, testEnv, type Client } from "./helpers";

const fixed = Date.parse("2026-09-24T14:00:00Z"); // Thursday of 2026 Week 3
const db = fakeD1(() => fixed);
const env = testEnv(db);

let provider: (url: string) => Promise<Response> = async () => new Response("Forbidden", { status: 403 });

const game: Game = {
  id: "test-game",
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
  teams: [
    { id: 901, name: "One" },
    { id: 902, name: "Two" },
  ],
  matchups: [],
  week: 3,
};
const pick = {
  eventId: game.id,
  market: "player_receptions",
  player: "Josh Downs",
  side: "Over",
  line: 4.5,
  odds: -156,
  book: "DraftKings",
  source: "feed",
  sourceTime: fixed,
};

let a: Client, b: Client; // Independent request contexts share only the database.
const post = (c: Client, p: Record<string, unknown> = pick) =>
  c.post({ action: "pick", season: 2026, week: 3, team: "901", pick: p });
const state = async (c: Client) =>
  json<{ picks: (PickRow & { pick: Record<string, unknown> })[] }>(await c.get("?season=2026&week=3"));
const picks = () => db.sql.prepare("SELECT * FROM picks").all() as unknown as PickRow[];

beforeAll(async () => {
  vi.useFakeTimers({ now: fixed, toFake: ["Date"] });
  vi.stubGlobal("fetch", (url: string | URL | Request) => provider(String(url instanceof Request ? url.url : url)));
  a = await client(env);
  b = await client(env);
  await putCache(db, "league:2026", league);
  await putCache(db, "games:2026:3", [game]);
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  db.close();
});
beforeEach(() => {
  provider = async () => new Response("Forbidden", { status: 403 });
});

describe("deferred player verification", () => {
  it("saves centrally when ESPN is unavailable and marks verification pending", async () => {
    const r = await post(a);
    expect(r.status).toBe(200);
    expect((await json(r)).verificationPending).toBe(true);
    const s = await state(b);
    expect(s.picks.length).toBe(1);
    expect(s.picks[0].pick.odds).toBe(-156);
    expect(s.picks[0].pick.line).toBe(4.5);
    expect(s.picks[0].pick.settlement).toBeUndefined();
    expect(s.picks[0].actual).toMatch(/verification pending/);
    expect(picks().length).toBe(1);
  });

  it("lets another client edit the same pick and rejects invalid picks", async () => {
    expect((await post(b, { ...pick, line: 5.5 })).status).toBe(200);
    expect((await state(a)).picks[0].pick.line).toBe(5.5);
    expect((await post(a, { ...pick, side: "Invalid" })).status).toBe(400);
  });

  it("defers on network failure and roster 403, but not on a clean no-match", async () => {
    provider = async () => {
      throw new TypeError("network unavailable");
    };
    expect((await post(a)).status).toBe(200);
    const summary: EspnSummary = {
      header: {
        id: game.id,
        competitions: [{ competitors: [{ id: "home" }, { id: "away" }], status: { type: { completed: false } } }],
      },
      boxscore: { players: [] },
    };
    await putCache(db, "box:" + game.id, summary);
    provider = async () => new Response("Forbidden", { status: 403 });
    expect((await post(a)).status).toBe(200); // Roster 403 also defers.
    for (const id of ["home", "away"]) await putCache(db, "roster:2026:" + id, { athletes: [] });
    expect((await post(a)).status).toBe(400); // A successful lookup with no match is not an outage.
  });

  it("stays pending for the wrong game, then verifies and settles deterministically via the alternate host", async () => {
    const summary: EspnSummary = {
      header: {
        id: game.id,
        competitions: [{ competitors: [{ id: "home" }, { id: "away" }], status: { type: { completed: false } } }],
      },
      boxscore: { players: [] },
    };
    const final: EspnSummary = {
      ...summary,
      header: { ...summary.header, competitions: [{ status: { type: { completed: true } } }] },
      boxscore: {
        players: [
          {
            statistics: [
              {
                name: "receiving",
                keys: ["receptions"],
                athletes: [{ athlete: { id: "verified-downs", displayName: "Josh Downs" }, stats: ["7"] }],
              },
            ],
          },
        ],
      },
    };
    await putCache(db, "box:" + game.id, { ...final, header: { ...final.header, id: "wrong" } });
    await grade(db, 2026, 3, [{ ...game, completed: true }]);
    expect(picks()[0].result).toBe("pending");

    // The first ESPN host may fail in production while the alternate serves the same schema.
    db.sql.prepare("DELETE FROM cache WHERE id=?").run("box:" + game.id);
    const hosts: string[] = [];
    provider = async (url) => {
      hosts.push(new URL(url).hostname);
      return new URL(url).hostname === "site.api.espn.com"
        ? new Response("Forbidden", { status: 403 })
        : Response.json(final);
    };
    await grade(db, 2026, 3, [{ ...game, completed: true }]);
    expect(hosts).toEqual(["site.api.espn.com", "site.web.api.espn.com"]);
    const saved = picks()[0];
    expect(saved.result).toBe("won");
    expect(JSON.parse(saved.data).settlement.athleteId).toBe("verified-downs");
    expect(JSON.parse(saved.data).verificationPending).toBe(false);
    await grade(db, 2026, 3, [{ ...game, completed: true }]);
    expect(picks()[0].result).toBe("won");
  });
});
